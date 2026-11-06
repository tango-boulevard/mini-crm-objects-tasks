import { taskStatusLabels } from '../../entities/task/model/status';
import type { TaskStatus } from '../types/domain';

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`status-badge status-${status}`}>{taskStatusLabels[status]}</span>;
}
