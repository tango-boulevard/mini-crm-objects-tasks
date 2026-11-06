import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/useAuth';
import { routes } from '../routes/routes';

export function AppLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href={routes.objects}>
          Объекты и задачи
        </a>
        <nav aria-label="Основная навигация">
          <NavLink to={routes.objects}>Объекты</NavLink>
          {profile?.role === 'executor' && <NavLink to={routes.myTasks}>Мои задачи</NavLink>}
        </nav>
        <div className="user-menu">
          <span>{profile?.display_name}</span>
          <button className="button ghost" type="button" onClick={() => void signOut()}>
            Выйти
          </button>
        </div>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
