export type AppRole = 'manager' | 'executor';

export type TaskStatus =
  | 'new'
  | 'in_progress'
  | 'in_review'
  | 'accepted'
  | 'needs_revision';

export interface Profile {
  id: string;
  display_name: string;
  role: AppRole;
  is_active: boolean;
}

export interface ConstructionObject {
  id: string;
  name: string;
  address: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  object_id: string;
  title: string;
  description: string;
  assignee_id: string;
  status: TaskStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWithAssignee extends Task {
  assignee: Pick<Profile, 'display_name'> | null;
}

export interface TaskDetails extends TaskWithAssignee {
  object: Pick<ConstructionObject, 'id' | 'name' | 'address'> | null;
  author: Pick<Profile, 'display_name'> | null;
}

export interface TaskStatusHistory {
  id: number;
  task_id: string;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  changed_by: string;
  changed_at: string;
  comment: string | null;
  actor: Pick<Profile, 'display_name'> | null;
}
