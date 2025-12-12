import axios from 'axios';

// 1. Cập nhật Interfaces khớp với Server thật
export interface User {
  id: string; // Server trả về 'id', không phải '_id'
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string; // Server trả về 'access_token'
  token_type: string;
}

export interface WorkspaceMember {
  role: string;
  userId: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  members?: any[];
}

// --- Interface mới cho Task ---
export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  projectId: string;
  creatorId: string;
  // Backend trả về mảng ID, nhưng UI cần hiển thị thông tin. 
  // Tạm thời để string[], sau này sẽ map với danh sách members của Project
  assignees: string[]; 
  labels: string[];    
  dueDate?: string;
  checklists?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

// Interface cho payload tạo/sửa
export interface CreateTaskPayload {
  title: string;
  description?: string;
  dueDate?: string;
  assignees?: string[];
  labels?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  dueDate?: string;
  assignees?: string[];
  labels?: string[];
  columnId?: string; // Dành cho việc di chuyển task (nếu API update hỗ trợ hoặc dùng endpoint riêng)
}

// 2. Cấu hình URL Server thật
const api = axios.create({
  baseURL: 'http://131.153.239.187:8345/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Interceptor (Giữ nguyên logic)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Cập nhật Endpoints
export const authApi = {
  // Login trả về access_token
  login: (email: string, password: string) => 
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  // Register trả về User object
  register: (name: string, email: string, password: string) => 
    api.post<User>('/auth/register', { name, email, password }),
  
  // Get Me đổi path thành /auth/me
  getMe: () => 
    api.get<User>('/auth/me'),
};

// Cập nhật hàm gọi API Workspace
export const workspaceApi = {
  // GET /api/v1/workspaces
  getAll: () => api.get<Workspace[]>('/workspaces'),
  
  // POST /api/v1/workspaces
  create: (name: string) => api.post<Workspace>('/workspaces', { name }),
};

export const projectApi = {
  getAllByWorkspace: (workspaceId: string) => 
    api.get<Project[]>(`/workspaces/${workspaceId}/projects`),
  
  create: (workspaceId: string, data: { name: string; description?: string }) => 
    api.post<Project>(`/workspaces/${workspaceId}/projects`, data),
    
  getDetail: (id: string) => api.get<Project>(`/projects/${id}`),
};

// Interface cho payload Move Task
export interface MoveTaskPayload {
  position: number; // Index mới trong cột
  targetColumnId: string;
}

export const taskApi = {
  // POST /api/v1/columns/{column_id}/tasks
  create: (columnId: string, data: CreateTaskPayload) => 
    api.post<Task>(`/columns/${columnId}/tasks`, data),

  // GET /api/v1/tasks/{task_id}
  getDetail: (taskId: string) => 
    api.get<Task>(`/tasks/${taskId}`),

  // PATCH /api/v1/tasks/{task_id}
  update: (taskId: string, data: UpdateTaskPayload) => 
    api.patch<Task>(`/tasks/${taskId}`, data),

  // DELETE /api/v1/tasks/{task_id}
  delete: (taskId: string) => 
    api.delete(`/tasks/${taskId}`),

  // PATCH /api/v1/tasks/{task_id}/move
  move: (taskId: string, data: MoveTaskPayload) => 
    api.patch<Task>(`/tasks/${taskId}/move`, data),

  // POST /api/v1/tasks/{task_id}/assignees
  addAssignee: (taskId: string, userId: string) => 
    api.post<Task>(`/tasks/${taskId}/assignees`, { userId }),

  // DELETE /api/v1/tasks/{task_id}/assignees/{user_id}
  removeAssignee: (taskId: string, userId: string) => 
    api.delete<Task>(`/tasks/${taskId}/assignees/${userId}`),

  // POST /api/v1/tasks/{task_id}/labels
  addLabel: (taskId: string, labelId: string) => 
    api.post<Task>(`/tasks/${taskId}/labels`, { labelId }),
};

export default api;