import API_BASE_URL, { API_ENDPOINTS } from '../config/api';
import type {
  Workspace,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspacesResponse,
} from '../types/workspace';

/**
 * Workspace API Service
 * Các hàm để kết nối với backend API cho Workspace
 */

// GET /api/v1/workspaces - Lấy danh sách các workspace mà người dùng là thành viên
export const getWorkspaces = async (): Promise<GetWorkspacesResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WORKSPACES}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Thêm Authorization header khi có token
      // 'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// POST /api/v1/workspaces - Tạo một workspace mới
export const createWorkspace = async (
  workspaceData: CreateWorkspaceRequest
): Promise<CreateWorkspaceResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WORKSPACES}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Thêm Authorization header khi có token
      // 'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(workspaceData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};
