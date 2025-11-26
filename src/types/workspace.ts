// Workspace types
export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  members?: WorkspaceMember[];
}

export interface CreateWorkspaceResponse {
  _id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetWorkspacesResponse {
  workspaces: Workspace[];
  total: number;
}
