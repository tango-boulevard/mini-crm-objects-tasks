import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '../../features/auth/ui/ProtectedRoute';
import { AppLayout } from '../../shared/ui/AppLayout';
import { LoginPage } from '../../pages/login/LoginPage';
import { MyTasksPage } from '../../pages/my-tasks/MyTasksPage';
import { ObjectDetailsPage } from '../../pages/object-details/ObjectDetailsPage';
import { ObjectsPage } from '../../pages/objects/ObjectsPage';
import { TaskDetailsPage } from '../../pages/task-details/TaskDetailsPage';
import { routes } from '../../shared/routes/routes';

export const router = createBrowserRouter([
  {
    path: routes.login,
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={routes.objects} replace /> },
          { path: routes.objects, element: <ObjectsPage /> },
          { path: routes.objectDetails, element: <ObjectDetailsPage /> },
          { path: routes.taskDetails, element: <TaskDetailsPage /> },
          { path: routes.myTasks, element: <MyTasksPage /> },
        ],
      },
    ],
  },
]);
