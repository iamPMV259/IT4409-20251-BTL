// API configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Workspace endpoints
  WORKSPACES: '/api/v1/workspaces',
  WORKSPACE_BY_ID: (id: string) => `/api/v1/workspaces/${id}`,
};

export default API_BASE_URL;
