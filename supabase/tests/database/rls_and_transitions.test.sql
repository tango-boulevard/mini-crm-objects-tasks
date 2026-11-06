begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@test.local',
    extensions.crypt('test-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'executor-a@test.local',
    extensions.crypt('test-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'executor-b@test.local',
    extensions.crypt('test-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

insert into public.profiles (id, display_name, role)
values
  ('00000000-0000-4000-8000-000000000001', 'Test Manager', 'manager'),
  ('00000000-0000-4000-8000-000000000002', 'Executor A', 'executor'),
  ('00000000-0000-4000-8000-000000000003', 'Executor B', 'executor');

insert into public.construction_objects (id, name, address, created_by)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Object A',
    'Address A',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Object B',
    'Address B',
    '00000000-0000-4000-8000-000000000001'
  );

insert into public.tasks (
  id,
  object_id,
  title,
  description,
  assignee_id,
  created_by
) values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Task A',
    'Task assigned to executor A',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'Task B',
    'Task assigned to executor B',
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000002',
  true
);

select is(
  (select count(*) from public.tasks),
  1::bigint,
  'executor A sees exactly one task'
);

select is(
  (select title from public.tasks limit 1),
  'Task A',
  'executor A sees only the assigned task'
);

select is(
  (select count(*) from public.construction_objects),
  1::bigint,
  'executor A sees only an object containing an assigned task'
);

select is(
  (select count(*) from public.task_status_history),
  1::bigint,
  'executor A sees only history for the assigned task'
);

select is_empty(
  $$
    update public.construction_objects
    set name = 'Forbidden'
    where true
    returning id
  $$,
  'executor updates zero object rows'
);

select is_empty(
  $$
    update public.tasks
    set assignee_id = '00000000-0000-4000-8000-000000000003'
    where true
    returning id
  $$,
  'executor reassigns zero task rows'
);

select throws_ok(
  $$ update public.tasks set status = 'accepted' where true $$,
  '42501',
  null,
  'executor cannot update status directly'
);

select throws_ok(
  $$ update public.task_status_history set comment = 'Forged' where true $$,
  '42501',
  null,
  'executor cannot modify history'
);

select lives_ok(
  $$ select public.transition_task_status(
    '20000000-0000-4000-8000-000000000001',
    'in_progress',
    null
  ) $$,
  'assigned executor can start a new task'
);

select is(
  (
    select status::text
    from public.tasks
    where id = '20000000-0000-4000-8000-000000000001'
  ),
  'in_progress',
  'successful transition changes current status'
);

select results_eq(
  $$
    select from_status::text, to_status::text, changed_by
    from public.task_status_history
    where task_id = '20000000-0000-4000-8000-000000000001'
      and from_status is not null
  $$,
  $$ values (
    'new'::text,
    'in_progress'::text,
    '00000000-0000-4000-8000-000000000002'::uuid
  ) $$,
  'transition stores trustworthy history'
);

select throws_ok(
  $$ select public.transition_task_status(
    '20000000-0000-4000-8000-000000000002',
    'in_progress',
    null
  ) $$,
  '42501',
  'Transition is not allowed',
  'executor cannot transition another executor task'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000001',
  true
);

select is(
  (
    select count(*)
    from public.tasks
    where id in (
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002'
    )
  ),
  2::bigint,
  'manager sees both test fixture tasks'
);

select throws_ok(
  $$ select public.transition_task_status(
    '20000000-0000-4000-8000-000000000001',
    'accepted',
    null
  ) $$,
  '23514',
  'Invalid task status transition',
  'manager cannot skip required statuses'
);

select throws_ok(
  $$ select public.transition_task_status(
    '20000000-0000-4000-8000-000000000001',
    'needs_revision',
    null
  ) $$,
  '23514',
  'Invalid task status transition',
  'revision is unavailable before review'
);

select * from finish();

rollback;
