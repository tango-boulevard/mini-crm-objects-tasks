import { Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '../../features/auth/ui/ProtectedRoute';
import { AppLayout } from '../../shared/ui/AppLayout';
import { routes } from '../../shared/routes/routes';
import {
  LoginPage,
  MyTasksPage,
  ObjectDetailsPage,
  ObjectsPage,
  TaskDetailsPage,
} from './lazyPages';

function page(element: ReactNode) {
  return <Suspense fallback={<p className="muted">Загрузка страницы…</p>}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: routes.login,
    element: page(<LoginPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={routes.objects} replace /> },
          { path: routes.objects, element: page(<ObjectsPage />) },
          { path: routes.objectDetails, element: page(<ObjectDetailsPage />) },
          { path: routes.taskDetails, element: page(<TaskDetailsPage />) },
          { path: routes.myTasks, element: page(<MyTasksPage />) },
        ],
      },
    ],
  },
]);
