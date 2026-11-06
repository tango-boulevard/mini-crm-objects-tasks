-- Idempotent data for the hosted review environment.
-- Create and auto-confirm the three Auth users listed below before running it.

do $$
declare
  v_manager uuid;
  v_executor_one uuid;
  v_executor_two uuid;
  v_transition record;
  v_from public.task_status;
begin
  select id into v_manager from auth.users where email = 'manager@local.test';
  select id into v_executor_one from auth.users where email = 'executor.one@local.test';
  select id into v_executor_two from auth.users where email = 'executor.two@local.test';

  if v_manager is null or v_executor_one is null or v_executor_two is null then
    raise exception 'Create all three demo Auth users before running demo-cloud.sql';
  end if;

  insert into public.profiles (id, display_name, role)
  values
    (v_manager, 'Марина Постановщик', 'manager'),
    (v_executor_one, 'Алексей Исполнитель', 'executor'),
    (v_executor_two, 'Ирина Исполнитель', 'executor')
  on conflict (id) do update
  set display_name = excluded.display_name, role = excluded.role, is_active = true;

  insert into public.construction_objects (id, name, address, created_by)
  values
    ('41000000-0000-4000-8000-000000000001', 'Жилой комплекс Северный', 'Москва, Северная улица, 12', v_manager),
    ('41000000-0000-4000-8000-000000000002', 'Складской комплекс Восток', 'Москва, Промышленный проезд, 8', v_manager),
    ('41000000-0000-4000-8000-000000000003', 'Бизнес-центр Речной', 'Москва, Береговая улица, 24', v_manager)
  on conflict (id) do update set name = excluded.name, address = excluded.address;

  insert into public.tasks (id, object_id, title, description, assignee_id, created_by)
  values
    ('51000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 'Проверить армирование первого этажа', 'Сверить армирование с проектом и зафиксировать результат проверки.', v_executor_one, v_manager),
    ('51000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000001', 'Подготовить фотоотчёт по перекрытию', 'Сделать фотографии ключевых узлов перекрытия и подготовить отчёт.', v_executor_two, v_manager),
    ('51000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000002', 'Проверить монтаж ворот', 'Проверить геометрию, крепления и работу автоматики ворот.', v_executor_one, v_manager),
    ('51000000-0000-4000-8000-000000000004', '41000000-0000-4000-8000-000000000003', 'Согласовать разводку электрики', 'Проверить соответствие разводки рабочей документации.', v_executor_two, v_manager),
    ('51000000-0000-4000-8000-000000000005', '41000000-0000-4000-8000-000000000003', 'Принять отделку входной группы', 'Проверить качество отделки и соответствие ведомости материалов.', v_executor_one, v_manager)
  on conflict (id) do nothing;

  for v_transition in
    select * from (values
      ('51000000-0000-4000-8000-000000000002', 'in_progress', v_executor_two, null::text, 1),
      ('51000000-0000-4000-8000-000000000003', 'in_progress', v_executor_one, null::text, 1),
      ('51000000-0000-4000-8000-000000000003', 'in_review', v_executor_one, null::text, 2),
      ('51000000-0000-4000-8000-000000000004', 'in_progress', v_executor_two, null::text, 1),
      ('51000000-0000-4000-8000-000000000004', 'in_review', v_executor_two, null::text, 2),
      ('51000000-0000-4000-8000-000000000004', 'needs_revision', v_manager, 'Уточнить маркировку кабельных линий на плане.', 3),
      ('51000000-0000-4000-8000-000000000005', 'in_progress', v_executor_one, null::text, 1),
      ('51000000-0000-4000-8000-000000000005', 'in_review', v_executor_one, null::text, 2),
      ('51000000-0000-4000-8000-000000000005', 'accepted', v_manager, null::text, 3)
    ) as transitions(task_id, to_status, actor_id, comment, step)
    order by task_id, step
  loop
    if not exists (
      select 1 from public.task_status_history
      where task_id = v_transition.task_id::uuid
        and to_status = v_transition.to_status::public.task_status
    ) then
      select status into v_from from public.tasks where id = v_transition.task_id::uuid;
      update public.tasks
      set status = v_transition.to_status::public.task_status
      where id = v_transition.task_id::uuid;
      insert into public.task_status_history (task_id, from_status, to_status, changed_by, comment)
      values (
        v_transition.task_id::uuid,
        v_from,
        v_transition.to_status::public.task_status,
        v_transition.actor_id,
        v_transition.comment
      );
    end if;
  end loop;
end;
$$;
