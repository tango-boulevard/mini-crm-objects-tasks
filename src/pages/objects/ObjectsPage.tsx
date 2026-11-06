import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { createObject, getObjects } from '../../entities/object/api/objects';
import { useAuth } from '../../features/auth/model/useAuth';
import { getErrorMessage } from '../../shared/lib/errors';
import { objectDetailsPath } from '../../shared/routes/routes';
import { AsyncState } from '../../shared/ui/AsyncState';

const objectSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(200),
  address: z.string().trim().min(1, 'Введите адрес').max(500),
});

type ObjectForm = z.infer<typeof objectSchema>;

export function ObjectsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const objectsQuery = useQuery({ queryKey: ['objects'], queryFn: getObjects });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ObjectForm>({ resolver: zodResolver(objectSchema) });
  const createMutation = useMutation({
    mutationFn: createObject,
    onSuccess: async () => {
      reset();
      setIsFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });

  const onSubmit = handleSubmit(async (values) => createMutation.mutateAsync(values));

  return (
    <section className="page-section wide">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Строительные площадки</p>
          <h1>Объекты</h1>
        </div>
        {profile?.role === 'manager' && (
          <button className="button primary" type="button" onClick={() => setIsFormOpen((open) => !open)}>
            {isFormOpen ? 'Отменить' : 'Добавить объект'}
          </button>
        )}
      </div>

      {isFormOpen && (
        <form className="panel stack-form compact" onSubmit={onSubmit}>
          <h2>Новый объект</h2>
          <label>
            Название
            <input {...register('name')} />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </label>
          <label>
            Адрес
            <input {...register('address')} />
            {errors.address && <span className="field-error">{errors.address.message}</span>}
          </label>
          {createMutation.error && <p className="error-text">{getErrorMessage(createMutation.error)}</p>}
          <button className="button primary" type="submit" disabled={createMutation.isPending}>
            Сохранить
          </button>
        </form>
      )}

      <AsyncState
        isLoading={objectsQuery.isLoading}
        error={objectsQuery.error ? getErrorMessage(objectsQuery.error) : null}
        empty={objectsQuery.data?.length === 0}
        emptyText="Доступных объектов пока нет"
      />

      <div className="card-grid">
        {objectsQuery.data?.map((object) => (
          <Link className="entity-card" key={object.id} to={objectDetailsPath(object.id)}>
            <h2>{object.name}</h2>
            <p>{object.address}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
