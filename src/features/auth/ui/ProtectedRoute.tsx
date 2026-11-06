import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { routes } from '../../../shared/routes/routes';
import { useAuth } from '../model/useAuth';

export function ProtectedRoute() {
  const { session, profile, isLoading, profileError } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="center-state">Проверяем сессию…</div>;
  }

  if (!session) {
    return <Navigate to={routes.login} state={{ from: location }} replace />;
  }

  if (!profile || !profile.is_active) {
    return (
      <div className="center-state error-text">
        {profileError ?? 'Профиль отсутствует или отключён. Обратитесь к постановщику.'}
      </div>
    );
  }

  return <Outlet />;
}
