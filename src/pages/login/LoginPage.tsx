import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useAuth } from '../../features/auth/model/useAuth';
import { supabase } from '../../shared/api/supabase';
import { getErrorMessage } from '../../shared/lib/errors';
import { routes } from '../../shared/routes/routes';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (session) return <Navigate to={routes.objects} replace />;

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitError(getErrorMessage(error));
      return;
    }
    void navigate(from ?? routes.objects, { replace: true });
  });

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Мини CRM</p>
        <h1>Вход</h1>
        <p className="page-description">Используйте выданные администратором email и пароль.</p>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" autoComplete="email" {...register('email')} />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </label>
          <label>
            Пароль
            <input type="password" autoComplete="current-password" {...register('password')} />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </label>
          {submitError && <p className="error-text">{submitError}</p>}
          <button className="button primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </section>
    </main>
  );
}
