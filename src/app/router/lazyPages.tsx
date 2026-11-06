import { lazy } from 'react';

export const LoginPage = lazy(() =>
  import('../../pages/login/LoginPage').then((module) => ({ default: module.LoginPage })),
);

export const MyTasksPage = lazy(() =>
  import('../../pages/my-tasks/MyTasksPage').then((module) => ({ default: module.MyTasksPage })),
);

export const ObjectDetailsPage = lazy(() =>
  import('../../pages/object-details/ObjectDetailsPage').then((module) => ({
    default: module.ObjectDetailsPage,
  })),
);

export const ObjectsPage = lazy(() =>
  import('../../pages/objects/ObjectsPage').then((module) => ({ default: module.ObjectsPage })),
);

export const TaskDetailsPage = lazy(() =>
  import('../../pages/task-details/TaskDetailsPage').then((module) => ({
    default: module.TaskDetailsPage,
  })),
);
