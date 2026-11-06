begin;

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('manager', 'executor');
create type public.task_status as enum (
  'new',
  'in_progress',
  'in_review',
  'accepted',
  'needs_revision'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create table public.construction_objects (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  address text not null check (length(trim(address)) between 1 and 500),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create table public.tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  object_id uuid not null references public.construction_objects (id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null check (length(trim(description)) between 1 and 5000),
  assignee_id uuid not null references public.profiles (id) on delete restrict,
  status public.task_status not null default 'new',
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create table public.task_status_history (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  from_status public.task_status,
  to_status public.task_status not null,
  changed_by uuid not null references public.profiles (id) on delete restrict,
  changed_at timestamptz not null default statement_timestamp(),
  comment text,
  constraint history_initial_transition_check check (
    (from_status is null and to_status = 'new') or from_status is not null
  ),
  constraint history_revision_comment_check check (
    to_status <> 'needs_revision' or length(trim(comment)) > 0
  )
);

create index tasks_object_id_idx on public.tasks (object_id);
create index tasks_assignee_status_idx on public.tasks (assignee_id, status);
create index tasks_created_by_idx on public.tasks (created_by);
create index task_status_history_task_timeline_idx
  on public.task_status_history (task_id, changed_at, id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger construction_objects_set_updated_at
before update on public.construction_objects
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create or replace function public.validate_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = new.assignee_id
      and profile.role = 'executor'
      and profile.is_active
  ) then
    raise exception using
      errcode = '23514',
      message = 'Task assignee must be an active executor';
  end if;

  return new;
end;
$$;

create trigger tasks_validate_assignee
before insert or update of assignee_id on public.tasks
for each row execute function public.validate_task_assignee();

create or replace function public.record_initial_task_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_status_history (
    task_id,
    from_status,
    to_status,
    changed_by,
    comment
  ) values (
    new.id,
    null,
    'new',
    new.created_by,
    null
  );

  return new;
end;
$$;

create trigger tasks_record_initial_status
after insert on public.tasks
for each row execute function public.record_initial_task_status();

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.profiles as profile
  where profile.id = auth.uid()
    and profile.is_active;
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_profile_role() = 'manager', false);
$$;

create or replace function public.transition_task_status(
  p_task_id uuid,
  p_target_status public.task_status,
  p_comment text default null
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.app_role;
  v_task public.tasks%rowtype;
  v_from_status public.task_status;
  v_comment text := nullif(trim(p_comment), '');
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select profile.role
  into v_actor_role
  from public.profiles as profile
  where profile.id = v_actor_id
    and profile.is_active;

  if v_actor_role is null then
    raise exception using errcode = '42501', message = 'Active profile required';
  end if;

  select task.*
  into v_task
  from public.tasks as task
  where task.id = p_task_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Task not found or unavailable';
  end if;

  if v_task.status = 'new' and p_target_status = 'in_progress' then
    if v_actor_role <> 'executor' or v_task.assignee_id <> v_actor_id then
      raise exception using errcode = '42501', message = 'Transition is not allowed';
    end if;
  elsif v_task.status = 'in_progress' and p_target_status = 'in_review' then
    if v_actor_role <> 'executor' or v_task.assignee_id <> v_actor_id then
      raise exception using errcode = '42501', message = 'Transition is not allowed';
    end if;
  elsif v_task.status = 'in_review' and p_target_status = 'accepted' then
    if v_actor_role <> 'manager' then
      raise exception using errcode = '42501', message = 'Transition is not allowed';
    end if;
  elsif v_task.status = 'in_review' and p_target_status = 'needs_revision' then
    if v_actor_role <> 'manager' then
      raise exception using errcode = '42501', message = 'Transition is not allowed';
    end if;
    if v_comment is null then
      raise exception using errcode = '23514', message = 'Revision comment is required';
    end if;
  elsif v_task.status = 'needs_revision' and p_target_status = 'in_progress' then
    if v_actor_role <> 'executor' or v_task.assignee_id <> v_actor_id then
      raise exception using errcode = '42501', message = 'Transition is not allowed';
    end if;
  else
    raise exception using errcode = '23514', message = 'Invalid task status transition';
  end if;

  v_from_status := v_task.status;

  update public.tasks as task
  set status = p_target_status
  where task.id = v_task.id
  returning task.* into v_task;

  insert into public.task_status_history (
    task_id,
    from_status,
    to_status,
    changed_by,
    comment
  ) values (
    v_task.id,
    v_from_status,
    p_target_status,
    v_actor_id,
    v_comment
  );

  return v_task;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.validate_task_assignee() from public;
revoke all on function public.record_initial_task_status() from public;
revoke all on function public.current_profile_role() from public;
revoke all on function public.is_manager() from public;
revoke all on function public.transition_task_status(uuid, public.task_status, text) from public;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.transition_task_status(uuid, public.task_status, text) to authenticated;

commit;
