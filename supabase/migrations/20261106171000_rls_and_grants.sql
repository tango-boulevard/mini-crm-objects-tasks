begin;

alter table public.profiles enable row level security;
alter table public.construction_objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.construction_objects from anon, authenticated;
revoke all on table public.tasks from anon, authenticated;
revoke all on table public.task_status_history from anon, authenticated;
revoke all on sequence public.task_status_history_id_seq from anon, authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.construction_objects to authenticated;
grant insert (name, address) on table public.construction_objects to authenticated;
grant update (name, address) on table public.construction_objects to authenticated;
grant delete on table public.construction_objects to authenticated;

grant select on table public.tasks to authenticated;
grant insert (object_id, title, description, assignee_id) on table public.tasks to authenticated;
grant update (object_id, title, description, assignee_id) on table public.tasks to authenticated;
grant delete on table public.tasks to authenticated;

grant select on table public.task_status_history to authenticated;

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_manager()
);

create policy construction_objects_select
on public.construction_objects
for select
to authenticated
using (
  public.is_manager()
  or exists (
    select 1
    from public.tasks as task
    where task.object_id = construction_objects.id
      and task.assignee_id = auth.uid()
  )
);

create policy construction_objects_insert
on public.construction_objects
for insert
to authenticated
with check (
  public.is_manager()
  and created_by = auth.uid()
);

create policy construction_objects_update
on public.construction_objects
for update
to authenticated
using (public.is_manager())
with check (public.is_manager());

create policy construction_objects_delete
on public.construction_objects
for delete
to authenticated
using (
  public.is_manager()
  and not exists (
    select 1
    from public.tasks as task
    where task.object_id = construction_objects.id
  )
);

create policy tasks_select
on public.tasks
for select
to authenticated
using (
  public.is_manager()
  or assignee_id = auth.uid()
);

create policy tasks_insert
on public.tasks
for insert
to authenticated
with check (
  public.is_manager()
  and created_by = auth.uid()
  and status = 'new'
);

create policy tasks_update
on public.tasks
for update
to authenticated
using (
  public.is_manager()
  and status = 'new'
)
with check (
  public.is_manager()
  and status = 'new'
);

create policy tasks_delete
on public.tasks
for delete
to authenticated
using (
  public.is_manager()
  and status = 'new'
  and not exists (
    select 1
    from public.task_status_history as history
    where history.task_id = tasks.id
      and history.from_status is not null
  )
);

create policy task_status_history_select
on public.task_status_history
for select
to authenticated
using (
  public.is_manager()
  or exists (
    select 1
    from public.tasks as task
    where task.id = task_status_history.task_id
      and task.assignee_id = auth.uid()
  )
);

commit;
