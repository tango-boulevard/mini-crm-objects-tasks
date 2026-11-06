import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getMyTasks } from '../../entities/task/api/tasks';
import { taskStatusLabels } from '../../entities/task/model/status';
import { taskDetailsPath } from '../../shared/routes/routes';
import type { TaskStatus } from '../../shared/types/domain';
import { AsyncState } from '../../shared/ui/AsyncState';
import { StatusBadge } from '../../shared/ui/StatusBadge';
import { getErrorMessage } from '../../shared/lib/errors';

const statuses = Object.entries(taskStatusLabels) as [TaskStatus, string][];

export function MyTasksPage() {
  const search = new URLSearchParams(window.location.search);
  const selectedStatus = (search.get('status') as TaskStatus | null) ?? undefined;
  const tasksQuery = useQuery({
    queryKey: ['my-tasks', selectedStatus],
    queryFn: () => getMyTasks(selectedStatus),
  });

  return (
    <section className="page-section wide">
      <p className="eyebrow">Исполнитель</p>
      <h1>Мои задачи</h1>
      <div className="filter-row" aria-label="Фильтр по статусу">
        <Link className={!selectedStatus ? 'filter-chip active' : 'filter-chip'} to="/my-tasks">Все</Link>
        {statuses.map(([status, label]) => (
          <Link
            className={selectedStatus === status ? 'filter-chip active' : 'filter-chip'}
            key={status}
            to={`/my-tasks?status=${status}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <AsyncState
        isLoading={tasksQuery.isLoading}
        error={tasksQuery.error ? getErrorMessage(tasksQuery.error) : null}
        empty={tasksQuery.data?.length === 0}
        emptyText="Задач с таким статусом нет"
      />
      <div className="list-stack">
        {tasksQuery.data?.map((task) => (
          <Link className="task-row" key={task.id} to={taskDetailsPath(task.id)}>
            <div><strong>{task.title}</strong></div>
            <StatusBadge status={task.status} />
          </Link>
        ))}
      </div>
    </section>
  );
}
