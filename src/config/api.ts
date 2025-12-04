// API configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Workspace endpoints
  WORKSPACES: '/api/v1/workspaces',
  WORKSPACE_BY_ID: (id: string) => `/api/v1/workspaces/${id}`,
  
  // Task endpoints
  CREATE_TASK: (columnId: string) => `/api/v1/columns/${columnId}/tasks`,
  TASK_BY_ID: (taskId: string) => `/api/v1/tasks/${taskId}`,
  UPDATE_TASK: (taskId: string) => `/api/v1/tasks/${taskId}`,
  MOVE_TASK: (taskId: string) => `/api/v1/tasks/${taskId}/move`,
  TASK_COMMENTS: (taskId: string) => `/api/v1/tasks/${taskId}/comments`,
};

export default API_BASE_URL;
