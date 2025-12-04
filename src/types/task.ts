// Task types
export interface TaskAssignee {
  userId: string;
  assignedAt: string;
}

export interface TaskChecklist {
  _id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  _id: string;
  content: string;
  completed: boolean;
}

export interface TaskComment {
  _id: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  columnId: string;
  assignees: TaskAssignee[];
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  checklists?: TaskChecklist[];
  comments?: TaskComment[];
  createdAt?: string;
  updatedAt?: string;
}

// Request/Response types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  assignees?: TaskAssignee[];
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface CreateTaskResponse {
  _id: string;
  title: string;
  columnId: string;
  assignees: TaskAssignee[];
  description?: string;
  dueDate?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTaskResponse {
  _id: string;
  title: string;
  description?: string;
  assignees: TaskAssignee[];
  checklists: TaskChecklist[];
  comments: TaskComment[];
  columnId: string;
  dueDate?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTaskResponse {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  updatedAt: string;
}

export interface MoveTaskRequest {
  targetColumnId: string;
  position?: number;
}

export interface MoveTaskResponse {
  status: string;
  message: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateCommentResponse {
  _id: string;
  content: string;
  userId: string;
  createdAt: string;
}
