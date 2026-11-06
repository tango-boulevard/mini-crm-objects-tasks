import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getTask, getTaskHistory, transitionTask } from '../../entities/task/api/tasks';
import { getAvailableTransitions, taskStatusLabels } from '../../entities/task/model/status';
import { useAuth } from '../../features/auth/model/useAuth';
import { getErrorMessage } from '../../shared/lib/errors';
import { objectDetailsPath } from '../../shared/routes/routes';
import { StatusBadge } from '../../shared/ui/StatusBadge';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function TaskDetailsPage() {
  const { taskId = '' } = useParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [commentTarget, setCommentTarget] = useState<'needs_revision' | null>(null);
  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
    enabled: Boolean(taskId),
  });
  const historyQuery = useQuery({
    queryKey: ['task-history', taskId],
    queryFn: () => getTaskHistory(taskId),
    enabled: Boolean(taskId),
  });
  const transitionMutation = useMutation({
    mutationFn: ({ target, transitionComment }: { target: Parameters<typeof transitionTask>[1]; transitionComment?: string }) =>
      transitionTask(taskId, target, transitionComment),
    onSuccess: async () => {
      setComment('');
      setCommentTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
        queryClient.invalidateQueries({ queryKey: ['task-history', taskId] }),
        queryClient.invalidateQueries({ queryKey: ['object-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['my-tasks'] }),
      ]);
    },
  });

  if (taskQuery.isLoading) return <div className="center-state">Загрузка задачи…</div>;
  if (taskQuery.error) return <div className="center-state error-text">{getErrorMessage(taskQuery.error)}</div>;
  if (!taskQuery.data || !profile) return <div className="center-state">Задача не найдена</div>;

  const task = taskQuery.data;
  const actions = getAvailableTransitions(task.status, profile.role, task.assignee_id === profile.id);

  const runTransition = (target: Parameters<typeof transitionTask>[1], requiresComment?: boolean) => {
    if (requiresComment) {
      setCommentTarget('needs_revision');
      return;
    }
    transitionMutation.mutate({ target });
  };

  return (
    <section className="page-section wide">
      {task.object && <Link className="back-link" to={objectDetailsPath(task.object.id)}>← {task.object.name}</Link>}
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Задача</p>
          <h1>{task.title}</h1>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="details-grid">
        <div className="panel">
          <h2>Описание</h2>
          <p className="pre-wrap">{task.description}</p>
        </div>
        <dl className="panel metadata-list">
          <div><dt>Объект</dt><dd>{task.object?.name ?? '—'}</dd></div>
          <div><dt>Исполнитель</dt><dd>{task.assignee?.display_name ?? '—'}</dd></div>
          <div><dt>Автор</dt><dd>{task.author?.display_name ?? '—'}</dd></div>
          <div><dt>Создана</dt><dd>{formatDate(task.created_at)}</dd></div>
        </dl>
      </div>

      {actions.length > 0 && (
        <div className="panel action-panel">
          <h2>Доступные действия</h2>
          <div className="button-row">
            {actions.map((action) => (
              <button
                className={`button ${action.tone === 'danger' ? 'danger' : 'primary'}`}
                disabled={transitionMutation.isPending}
                key={action.target}
                onClick={() => runTransition(action.target, action.requiresComment)}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
          {commentTarget && (
            <div className="comment-form">
              <label>
                Что нужно доработать
                <textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
              </label>
              <div className="button-row">
                <button
                  className="button danger"
                  disabled={!comment.trim() || transitionMutation.isPending}
                  onClick={() => transitionMutation.mutate({ target: commentTarget, transitionComment: comment.trim() })}
                  type="button"
                >
                  Подтвердить возврат
                </button>
                <button className="button ghost" onClick={() => setCommentTarget(null)} type="button">Отменить</button>
              </div>
            </div>
          )}
          {transitionMutation.error && <p className="error-text">{getErrorMessage(transitionMutation.error)}</p>}
        </div>
      )}

      <div className="section-heading"><h2>История статусов</h2></div>
      {historyQuery.isLoading && <p className="muted">Загрузка истории…</p>}
      {historyQuery.error && <p className="error-text">{getErrorMessage(historyQuery.error)}</p>}
      <ol className="timeline">
        {historyQuery.data?.map((entry) => (
          <li key={entry.id}>
            <div className="timeline-marker" />
            <div>
              <strong>
                {entry.from_status ? `${taskStatusLabels[entry.from_status]} → ` : ''}
                {taskStatusLabels[entry.to_status]}
              </strong>
              <span>{entry.actor?.display_name ?? 'Системный пользователь'} · {formatDate(entry.changed_at)}</span>
              {entry.comment && <p>{entry.comment}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
