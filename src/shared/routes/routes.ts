export const routes = {
  login: '/login',
  objects: '/objects',
  objectDetails: '/objects/:objectId',
  taskDetails: '/tasks/:taskId',
  myTasks: '/my-tasks',
} as const;

export const objectDetailsPath = (objectId: string) => `/objects/${objectId}`;
export const taskDetailsPath = (taskId: string) => `/tasks/${taskId}`;
