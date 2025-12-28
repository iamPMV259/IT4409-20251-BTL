import axios from 'axios';

// --- CONFIGURATION ---
// Sử dụng environment variable để hỗ trợ cả development và production
// Development: /api/v1 (proxy qua Vite)
// Production: http://131.153.239.187:8345/api/v1 (direct)
const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// ==========================================
//                 TYPES
// ==========================================

// --- AUTH & USER ---
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// --- WORKSPACE ---
export interface WorkspaceMember {
  userId: string;
  role: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

// --- PROJECT ---
export interface OwnerInfo {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

export interface ProjectMember {
  user_id: string;
  role: string;
}

export interface TaskStats {
  open: number;
  closed: number;
}

// Dữ liệu Project khi lấy danh sách (GET /projects)
export interface ProjectGetData {
  id: string;
  name: string;
  description?: string | null;
  workspace_id: string;
  // owner: OwnerInfo;
  // members: ProjectMember[];
  status?: string;
  task_stats?: TaskStats;
  deadline?: string | null;
  created_at: string;
  updated_at: string;
}

// Dữ liệu Project chi tiết (GET /projects/:id)
export interface ProjectDetailData extends ProjectGetData {
  column_order: string[]; // Chỉ chứa ID các cột
}

export interface ProjectCreateRequest {
  name: string;
  description: string;
  deadline?: string | null;
}

export interface ProjectCreatedResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    description?: string;
    workspace_id: string;
    owner_id: string;
    // ... các trường khác
  };
  initial_columns: any[];
}

export interface ProjectGetResponse {
  success: boolean;
  count: number;
  data: ProjectGetData[];
}

// --- COLUMN ---
export interface ColumnData {
  id: string;
  title: string;
  project_id: string;
  task_order: string[];
  created_at: string;
  updated_at: string;
}

export interface ColumnResponse {
  success: boolean;
  message: string;
  data: ColumnData;
}

// --- TASK ---
export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface TaskResponse {
id: string;
  title: string;
  description?: string | null;
  projectId: string;
  columnId: string;
  creatorId: string;
assignees: string[]; 
  labels: string[];   
  dueDate?: string | null;
checklists: { text: string; checked: boolean }[];
comments?: Comment[];  
createdAt: string;
  updatedAt: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  dueDate?: string;
  assignees?: string[];
  labels?: string[];
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  dueDate?: string;
}

// --- 1. THÊM TYPES CHO BOARD (Dựa trên Schema BoardData) ---
export interface BoardProject {
  id: string;
  name: string;
  owner_id: string;
  column_order: string[];
  // members... (có thể thêm nếu cần)
}

export interface BoardColumn {
  id: string;
  title: string;
  project_id: string;
  tasks: TaskResponse[]; // Mảng task nằm ngay trong column
  created_at: string;
  updated_at: string;
}

export interface BoardData {
  project: BoardProject;
  columns: BoardColumn[];
}

// --- THÊM TYPE CHO COMMENT ---
export interface Comment {
commentId: string; // JSON trả về 'commentId', không phải 'id'
  userId: string;
  content: string;
  createdAt: string;
  taskId: string;
  username?: string; // JSON có field này, rất tiện để hiển thị tên
}
// 2. Cập nhật Interface Assignee (Theo JSON mẫu)
export interface TaskAssignee {
  userId: string;
  name: string;
  avatarUrl?: string;
}

// --- TYPE CHO LABELS ---
export interface Label {
  id: string;
  projectId: string;
  text: string;
  color: string; // Hex code: #FF0000
}

export interface LabelCreate {
  text: string;
  color: string;
}

// --- MỚI: Type cho Joined Project (Dashboard) ---
// Dựa trên schema JoinedProjectResponse trong OpenAPI mới
export interface JoinedProject {
  role: string;
  project_id: string;
  project_name: string;
  workspace_id?: string | null;
  // Các trường bổ sung (Cần Backend trả về thêm trong tương lai)
  description?: string;
  status?: string;      // 'active', 'completed', 'on_hold'...
  deadline?: string;    // ISO Date string
  task_stats?: {        // Thống kê task để vẽ progress bar
    open: number;
    closed: number;
  };
}
// ==========================================
//              API CLIENTS
// ==========================================

export const authApi = {
  login: (email: string, password: string) => 
    api.post<TokenResponse>('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) => 
    api.post<UserResponse>('/auth/register', { name, email, password }),
  
  getMe: () => 
    api.get<UserResponse>('/auth/me'),
};

export const workspaceApi = {
  getAll: () => 
    api.get<WorkspaceResponse[]>('/workspaces'),
  
  create: (name: string) => 
    api.post<WorkspaceResponse>('/workspaces', { name }),
  
  getProjects: (workspaceId: string) =>
    api.get<ProjectGetResponse>(`/workspaces/${workspaceId}/projects`),

  createProject: (workspaceId: string, data: ProjectCreateRequest) =>
    api.post<ProjectCreatedResponse>(`/workspaces/${workspaceId}/projects`, data),
  // --- MỚI: API QUAN TRỌNG ĐỂ FIX DASHBOARD ---
  // GET /api/v1/workspaces/joined_projects
  getJoinedProjects: (workspaceId?: string) => 
    api.get<JoinedProject[]>('/workspaces/joined_projects', {
      params: workspaceId ? { workspace_id: workspaceId } : {}
    }),
};

export const projectApi = {

  // THÊM: API lấy toàn bộ bảng (Project + Columns + Tasks)
  getBoard: (projectId: string) =>
    api.get<{ success: boolean; data: BoardData }>(`/projects/${projectId}/board`),
    
  // GET /api/v1/projects/{id}
  getDetail: (projectId: string) =>
    api.get<{ success: boolean; data: ProjectDetailData }>(`/projects/${projectId}`),
  
  // GET /api/v1/projects/{id}/dashboard
  getDashboard: (projectId: string) =>
    api.get<{ success: boolean; data: any }>(`/projects/${projectId}/dashboard`),
    
  // THÊM: Mời thành viên vào dự án
  addMember: (projectId: string, email: string) =>
    api.post(`/projects/${projectId}/members`, [email]), // Backend yêu cầu mảng string

  // POST /api/v1/projects/{id}/columns
  // Lưu ý: column_title gửi qua Query Params theo OpenAPI mới
  createColumn: (projectId: string, columnTitle: string) =>
    api.post<ColumnResponse>(
      `/projects/${projectId}/columns`, 
      {}, // Body rỗng
      { params: { column_title: columnTitle } }
    ),

  // Lấy danh sách Label của Project
  getLabels: (projectId: string) =>
    api.get<Label[]>(`/projects/${projectId}/labels`),

  // // Tạo Label mới cho Project
  // createLabels: (projectId: string, labels: LabelCreate[]) =>
  //   api.post<Label[]>(`/projects/${projectId}/labels`, labels),
  // Cập nhật thông tin dự án
  update: (projectId: string, data: { name?: string; description?: string; deadline?: string; status?: string }) =>
    api.patch(`/projects/${projectId}`, data),

  // Xóa dự án
  delete: (projectId: string) => 
    api.delete(`/projects/${projectId}`),
    
  // Tạo nhãn mới (Cho tính năng tiếp theo)
  createLabel: (projectId: string, data: { text: string; color: string }[]) =>
    api.post(`/projects/${projectId}/labels`, data),
};

export const columnApi = {
  create: (projectId: string, title: string) =>
    api.post(`/projects/${projectId}/columns`, null, {
      params: { column_title: title }
    }),

  // Cập nhật tên cột
  update: (columnId: string, title: string) =>
    api.patch(`/columns/${columnId}`, { title }),

  // Xóa cột
  delete: (columnId: string) => 
    api.delete(`/columns/${columnId}`),
};

export const taskApi = {
  // POST /api/v1/columns/{id}/tasks
  create: (columnId: string, data: TaskCreate) => 
    api.post<TaskResponse>(`/columns/${columnId}/tasks`, data),

  // GET /api/v1/tasks/{id}
  getDetail: (taskId: string) => api.get<TaskResponse>(`/tasks/${taskId}`),
  
  // PATCH /api/v1/tasks/{id}
  update: (taskId: string, data: TaskUpdate) => 
    api.patch<TaskResponse>(`/tasks/${taskId}`, data),
    
  // DELETE /api/v1/tasks/{id}
  delete: (taskId: string) => api.delete(`/tasks/${taskId}`),
  
  // PATCH /api/v1/tasks/{id}/move
  move: (taskId: string, targetColumnId: string, position?: number) =>
    api.patch<TaskResponse>(`/tasks/${taskId}/move`, { 
      targetColumnId, 
      position 
    }),

  // THÊM: Gửi bình luận
  addComment: (taskId: string, content: string) =>
    api.post<Comment>(`/tasks/${taskId}/comments`, { content }),
    
  // Thêm Label vào Task
  addLabel: (taskId: string, labelId: string) =>
    api.post(`/tasks/${taskId}/labels`, { labelId }),
    
  // Xóa nhiều Labels khỏi Task (DELETE với body là array UUID)
  removeLabels: (taskId: string, labelIds: string[]) =>
    api.delete(`/tasks/${taskId}/labels`, { data: labelIds }),

  // Thêm người vào Task
  addAssignee: (taskId: string, userId: string) =>
    api.post(`/tasks/${taskId}/assignees`, { userId }),
    
  // Xóa người khỏi Task
  removeAssignee: (taskId: string, userId: string) =>
    api.delete(`/tasks/${taskId}/assignees/${userId}`),
    
  // --- MỚI: CHECKLIST API ---
  addChecklistItem: (taskId: string, text: string, checked?: boolean) =>
    api.post(`/tasks/${taskId}/checklist-items`, { text, checked: checked ?? false }),

  // Lưu ý: API dùng item_index (số thứ tự) thay vì ID
  updateChecklistItem: (taskId: string, index: number, data: { text?: string; checked?: boolean }) =>
    api.patch(`/tasks/${taskId}/checklist-items/${index}`, data),

  // GET /api/v1/search/me/tasks - Lấy tất cả tasks của user hiện tại
  getMyTasks: (params?: {
    project_id?: string;
    label_id?: string;
    no_due_date?: boolean;
    overdue?: boolean;
    this_week?: boolean;
  }) => api.get<TaskResponse[]>('/search/me/tasks', { params }),
};

// --- SEARCH API ---
export interface ProjectSearchResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
  deadline: string | null;
  workspaceId: string;
}

export interface TaskSearchResponse {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  projectId: string;
  projectName: string;
  columnId: string;
  columnName: string;
  labels: Array<{
    labelId: string;
    text: string;
  }>;
}

export const searchApi = {
  // GET /api/v1/search/projects/search?query={string}
  searchProjects: (query: string) =>
    api.get<ProjectSearchResponse[]>('/search/projects/search', { 
      params: { query } 
    }),

  // GET /api/v1/search/tasks/search?query={string}
  searchTasks: (query: string) =>
    api.get<TaskSearchResponse[]>('/search/tasks/search', { 
      params: { query } 
    }),
    
  // GET /api/v1/search/me/projects - Get projects visible to current user
  getMyProjects: () => 
    api.get<ProjectGetData[]>('/search/me/projects'),
    
  // GET /api/v1/search/me/labels - Get labels visible to current user
  getMyLabels: () => 
    api.get<Label[]>('/search/me/labels'),
};

export default api;