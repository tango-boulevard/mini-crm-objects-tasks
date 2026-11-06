-- Local demonstration accounts only. Never reuse these passwords in a cloud environment.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@local.test',
    extensions.crypt('Manager123!', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'executor.one@local.test',
    extensions.crypt('Executor123!', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'executor.two@local.test',
    extensions.crypt('Executor123!', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  extensions.gen_random_uuid(),
  user_row.id::text,
  user_row.id,
  jsonb_build_object('sub', user_row.id::text, 'email', user_row.email),
  'email',
  now(),
  now(),
  now()
from auth.users as user_row
where user_row.id in (
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003'
)
on conflict (provider_id, provider) do nothing;

insert into public.profiles (id, display_name, role)
values
  ('30000000-0000-4000-8000-000000000001', 'Марина Постановщик', 'manager'),
  ('30000000-0000-4000-8000-000000000002', 'Алексей Исполнитель', 'executor'),
  ('30000000-0000-4000-8000-000000000003', 'Ирина Исполнитель', 'executor')
on conflict (id) do nothing;

do $$
declare
  v_manager_id uuid;
  v_executor_one_id uuid;
  v_executor_two_id uuid;
  v_object_one_id uuid := '11000000-0000-4000-8000-000000000001';
  v_object_two_id uuid := '11000000-0000-4000-8000-000000000002';
begin
  select id into v_manager_id
  from public.profiles
  where role = 'manager' and is_active
  order by created_at
  limit 1;

  select id into v_executor_one_id
  from public.profiles
  where role = 'executor' and is_active
  order by created_at
  limit 1;

  select id into v_executor_two_id
  from public.profiles
  where role = 'executor' and is_active and id <> v_executor_one_id
  order by created_at
  limit 1;

  insert into public.construction_objects (id, name, address, created_by)
  values
    (v_object_one_id, 'Жилой комплекс Северный', 'Москва, Северная улица, 12', v_manager_id),
    (v_object_two_id, 'Складской комплекс Восток', 'Москва, Промышленный проезд, 8', v_manager_id)
  on conflict (id) do nothing;

  insert into public.tasks (
    id, object_id, title, description, assignee_id, status, created_by
  ) values
    (
      '21000000-0000-4000-8000-000000000001',
      v_object_one_id,
      'Проверить армирование первого этажа',
      'Сверить выполненное армирование с рабочей документацией и зафиксировать результат.',
      v_executor_one_id,
      'new',
      v_manager_id
    ),
    (
      '21000000-0000-4000-8000-000000000002',
      v_object_one_id,
      'Подготовить фотоотчёт по перекрытию',
      'Сделать общий и детальные снимки перед бетонированием.',
      v_executor_two_id,
      'new',
      v_manager_id
    ),
    (
      '21000000-0000-4000-8000-000000000003',
      v_object_two_id,
      'Проверить монтаж ворот',
      'Проверить геометрию, крепления и работу приводов.',
      v_executor_one_id,
      'new',
      v_manager_id
    )
  on conflict (id) do nothing;
end;
$$;
