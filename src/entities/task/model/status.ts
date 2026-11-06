import type { AppRole, TaskStatus } from '../../../shared/types/domain';

export const taskStatusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  in_review: 'На проверке',
  accepted: 'Принята',
  needs_revision: 'На доработке',
};

export interface TaskTransitionAction {
  target: TaskStatus;
  label: string;
  requiresComment?: boolean;
  tone?: 'primary' | 'danger';
}

export function getAvailableTransitions(
  status: TaskStatus,
  role: AppRole,
  isAssignedExecutor: boolean,
): TaskTransitionAction[] {
  if (role === 'executor' && isAssignedExecutor) {
    if (status === 'new' || status === 'needs_revision') {
      return [{ target: 'in_progress', label: 'Взять в работу', tone: 'primary' }];
    }

    if (status === 'in_progress') {
      return [{ target: 'in_review', label: 'Отправить на проверку', tone: 'primary' }];
    }
  }

  if (role === 'manager' && status === 'in_review') {
    return [
      { target: 'accepted', label: 'Принять задачу', tone: 'primary' },
      {
        target: 'needs_revision',
        label: 'Вернуть на доработку',
        requiresComment: true,
        tone: 'danger',
      },
    ];
  }

  return [];
}
