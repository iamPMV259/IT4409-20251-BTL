import API_BASE_URL, { API_ENDPOINTS } from '../config/api';
import type {
  Task,
  CreateTaskRequest,
  CreateTaskResponse,
  GetTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
  MoveTaskRequest,
  MoveTaskResponse,
  CreateCommentRequest,
  CreateCommentResponse,
} from '../types/task';

/**
 * Task API Service
 * Các hàm để kết nối với backend API cho Tasks
 */

// POST /api/v1/columns/{id}/tasks - Tạo một task mới trong một cột
export const createTask = async (
  columnId: string,
  taskData: CreateTaskRequest
): Promise<CreateTaskResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_TASK(columnId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Thêm Authorization header khi có token
      // 'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// GET /api/v1/tasks/{id} - Lấy thông tin chi tiết của một task (dùng cho modal)
export const getTaskById = async (taskId: string): Promise<GetTaskResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TASK_BY_ID(taskId)}`, {
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

// PATCH /api/v1/tasks/{id} - Cập nhật thông tin cơ bản của task
export const updateTask = async (
  taskId: string,
  taskData: UpdateTaskRequest
): Promise<UpdateTaskResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_TASK(taskId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // Thêm Authorization header khi có token
      // 'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// PATCH /api/v1/tasks/{id}/move - Xử lý Drag-and-Drop
export const moveTask = async (
  taskId: string,
  moveData: MoveTaskRequest
): Promise<MoveTaskResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MOVE_TASK(taskId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // Thêm Authorization header khi có token
      // 'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(moveData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// POST /api/v1/tasks/{id}/comments - Thêm một bình luận vào task
export const addCommentToTask = async (
  taskId: string,
  commentData: CreateCommentRequest
): Promise<CreateCommentResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TASK_COMMENTS(taskId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Thêm Authorization header khi có token
      // 'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(commentData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};
