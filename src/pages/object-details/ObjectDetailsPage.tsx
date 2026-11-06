import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';

import { getObject } from '../../entities/object/api/objects';
import { getExecutors } from '../../entities/profile/api/profiles';
import { createTask, getObjectTasks } from '../../entities/task/api/tasks';
import { useAuth } from '../../features/auth/model/useAuth';
import { getErrorMessage } from '../../shared/lib/errors';
import { routes, taskDetailsPath } from '../../shared/routes/routes';
import { AsyncState } from '../../shared/ui/AsyncState';
import { StatusBadge } from '../../shared/ui/StatusBadge';

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Введите название').max(200),
  description: z.string().trim().min(1, 'Введите описание').max(5000),
  assignee_id: z.string().uuid('Выберите исполнителя'),
});

type TaskForm = z.infer<typeof taskSchema>;

export function ObjectDetailsPage() {
  const { objectId = '' } = useParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const objectQuery = useQuery({
    queryKey: ['object', objectId],
    queryFn: () => getObject(objectId),
    enabled: Boolean(objectId),
  });
  const tasksQuery = useQuery({
    queryKey: ['object-tasks', objectId],
    queryFn: () => getObjectTasks(objectId),
    enabled: Boolean(objectId),
  });
  const executorsQuery = useQuery({
    queryKey: ['executors'],
    queryFn: getExecutors,
    enabled: profile?.role === 'manager',
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskForm>({ resolver: zodResolver(taskSchema) });
  const createMutation = useMutation({
    mutationFn: (input: TaskForm) => createTask({ object_id: objectId, ...input }),
    onSuccess: async () => {
      reset();
      setIsFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['object-tasks', objectId] });
    },
  });

  if (objectQuery.isLoading) return <div className="center-state">Загрузка объекта…</div>;
  if (objectQuery.error) return <div className="center-state error-text">{getErrorMessage(objectQuery.error)}</div>;
  if (!objectQuery.data) return <div className="center-state">Объект не найден</div>;

  return (
    <section className="page-section wide">
      <Link className="back-link" to={routes.objects}>← Все объекты</Link>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Объект</p>
          <h1>{objectQuery.data.name}</h1>
          <p className="page-description">{objectQuery.data.address}</p>
        </div>
        {profile?.role === 'manager' && (
          <button className="button primary" type="button" onClick={() => setIsFormOpen((open) => !open)}>
            {isFormOpen ? 'Отменить' : 'Добавить задачу'}
          </button>
        )}
      </div>

      {isFormOpen && (
        <form className="panel stack-form compact" onSubmit={handleSubmit((value) => createMutation.mutateAsync(value))}>
          <h2>Новая задача</h2>
          <label>
            Название
            <input {...register('title')} />
            {errors.title && <span className="field-error">{errors.title.message}</span>}
          </label>
          <label>
            Описание
            <textarea rows={4} {...register('description')} />
            {errors.description && <span className="field-error">{errors.description.message}</span>}
          </label>
          <label>
            Исполнитель
            <select defaultValue="" {...register('assignee_id')}>
              <option value="" disabled>Выберите исполнителя</option>
              {executorsQuery.data?.map((executor) => (
                <option key={executor.id} value={executor.id}>{executor.display_name}</option>
              ))}
            </select>
            {errors.assignee_id && <span className="field-error">{errors.assignee_id.message}</span>}
          </label>
          {createMutation.error && <p className="error-text">{getErrorMessage(createMutation.error)}</p>}
          <button className="button primary" type="submit" disabled={createMutation.isPending}>
            Создать задачу
          </button>
        </form>
      )}

      <div className="section-heading"><h2>Задачи</h2></div>
      <AsyncState
        isLoading={tasksQuery.isLoading}
        error={tasksQuery.error ? getErrorMessage(tasksQuery.error) : null}
        empty={tasksQuery.data?.length === 0}
        emptyText="На объекте пока нет доступных задач"
      />
      <div className="list-stack">
        {tasksQuery.data?.map((task) => (
          <Link className="task-row" key={task.id} to={taskDetailsPath(task.id)}>
            <div>
              <strong>{task.title}</strong>
              <span>{task.assignee?.display_name ?? 'Исполнитель не найден'}</span>
            </div>
            <StatusBadge status={task.status} />
          </Link>
        ))}
      </div>
    </section>
  );
}
