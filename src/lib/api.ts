// src/lib/api.ts
import axios from 'axios';

// 1. Định nghĩa các Type dựa trên mô tả của Backend
export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Workspace {
  _id: string;
  name: string;
  ownerId: string;
  members: any[];
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'archived'; // Map với status của bạn
  members?: any[];
  workspaceId?: string; // Giả định project thuộc về workspace
}

// 2. Cấu hình Axios Instance
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // ĐỔI URL NÀY theo server backend của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Interceptor: Tự động gắn Token vào mỗi request
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

// 4. Các hàm gọi API cụ thể

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) => 
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) => 
    api.post('/auth/register', { name, email, password }),
  
  getMe: () => 
    api.get<User>('/users/me'),
};

// --- Workspaces ---
export const workspaceApi = {
  getAll: () => api.get<Workspace[]>('/workspaces'),
  create: (name: string) => api.post<Workspace>('/workspaces', { name }),
};

// --- Projects ---
export const projectApi = {
  getAllByWorkspace: (workspaceId: string) => 
    api.get<Project[]>(`/workspaces/${workspaceId}/projects`),
  
  create: (workspaceId: string, data: { name: string; description?: string }) => 
    api.post<Project>(`/workspaces/${workspaceId}/projects`, data),
    
  getDetail: (id: string) => api.get<Project>(`/projects/${id}`),
};

export default api;