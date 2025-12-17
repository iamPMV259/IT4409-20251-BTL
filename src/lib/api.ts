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

// Interface cho assignee hiển thị UI
export interface TaskAssignee {
  id?: string;
  name: string;
  avatar?: string;
}

// Interface cho label hiển thị UI
export interface TaskLabel {
  id?: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId?: string;
  projectId?: string;
  creatorId?: string;
  // Có thể là string[] (từ API) hoặc object[] (cho UI)
  assignees: TaskAssignee[] | string[]; 
  labels: TaskLabel[] | string[];    
  dueDate?: string;
  checklists?: ChecklistItem[];
  checklist?: { total: number; completed: number }; // Cho UI hiển thị
  comments?: number;
  attachments?: number;
  createdAt?: string;
  updatedAt?: string;
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

  // PATCH /api/v1/projects/{project_id} - Update project details
  update: (projectId: string, data: { name?: string; description?: string }) =>
    api.patch<Project>(`/projects/${projectId}`, data),

  // DELETE /api/v1/projects/{project_id} - Delete a project
  delete: (projectId: string) =>
    api.delete(`/projects/${projectId}`),

  // POST /api/v1/projects/{project_id}/members - Add member to project
  addMember: (projectId: string, userId: string) =>
    api.post(`/projects/${projectId}/members`, { userId }),

  // POST /api/v1/projects/{project_id}/columns - Create default columns for project
  createDefaultColumns: (projectId: string) =>
    api.post<Column[]>(`/projects/${projectId}/columns`),
};

// --- Interface cho Column ---
export interface Column {
  id: string;
  name: string;
  projectId: string;
  position: number;
  tasks?: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateColumnPayload {
  name: string;
  position?: number;
}

export interface UpdateColumnPayload {
  name?: string;
  position?: number;
}

// --- Column API ---
export const columnApi = {
  // PATCH /api/v1/columns/{column_id} - Update a column
  update: (columnId: string, data: UpdateColumnPayload) =>
    api.patch<Column>(`/columns/${columnId}`, data),

  // DELETE /api/v1/columns/{column_id} - Delete a column
  delete: (columnId: string) =>
    api.delete(`/columns/${columnId}`),
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