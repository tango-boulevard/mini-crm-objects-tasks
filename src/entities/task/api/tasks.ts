import { supabase } from '../../../shared/api/supabase';
import type {
  TaskDetails,
  TaskStatus,
  TaskStatusHistory,
  TaskWithAssignee,
} from '../../../shared/types/domain';

const taskListSelection = `
  *,
  assignee:profiles!tasks_assignee_id_fkey(display_name)
`;

export async function getObjectTasks(objectId: string): Promise<TaskWithAssignee[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(taskListSelection)
    .eq('object_id', objectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMyTasks(status?: TaskStatus): Promise<TaskWithAssignee[]> {
  let query = supabase.from('tasks').select(taskListSelection).order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getTask(taskId: string): Promise<TaskDetails> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(display_name),
      author:profiles!tasks_created_by_fkey(display_name),
      object:construction_objects!tasks_object_id_fkey(id, name, address)
    `)
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data;
}

export async function getTaskHistory(taskId: string): Promise<TaskStatusHistory[]> {
  const { data, error } = await supabase
    .from('task_status_history')
    .select(`
      *,
      actor:profiles!task_status_history_changed_by_fkey(display_name)
    `)
    .eq('task_id', taskId)
    .order('changed_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return data;
}

interface CreateTaskInput {
  object_id: string;
  title: string;
  description: string;
  assignee_id: string;
}

export async function createTask(input: CreateTaskInput): Promise<void> {
  const { error } = await supabase.from('tasks').insert(input);
  if (error) throw error;
}

export async function transitionTask(
  taskId: string,
  targetStatus: TaskStatus,
  comment?: string,
): Promise<void> {
  const { error } = await supabase.rpc('transition_task_status', {
    p_task_id: taskId,
    p_target_status: targetStatus,
    p_comment: comment ?? null,
  });

  if (error) throw error;
}
