import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi, projectApi, WorkspaceResponse, JoinedProject } from '../lib/api';

export function useWorkspaces() {
  const queryClient = useQueryClient();

  // Get all workspaces
  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await workspaceApi.getAll();
      return response.data as WorkspaceResponse[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get joined projects
  const joinedProjectsQuery = useQuery({
    queryKey: ['joined-projects'],
    queryFn: async () => {
      const response = await workspaceApi.getJoinedProjects();
      return response.data as JoinedProject[];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await workspaceApi.create(name);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      name,
      description,
      deadline,
    }: {
      workspaceId: string;
      name: string;
      description: string;
      deadline?: string;
    }) => {
      const response = await workspaceApi.createProject(workspaceId, {
        name,
        description,
        deadline,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joined-projects'] });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await projectApi.delete(projectId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate để reload lại danh sách projects
      queryClient.invalidateQueries({ queryKey: ['joined-projects'] });
    },
  });

  return {
    workspaces: workspacesQuery.data,
    isLoadingWorkspaces: workspacesQuery.isLoading,
    joinedProjects: joinedProjectsQuery.data,
    isLoadingProjects: joinedProjectsQuery.isLoading,
    createWorkspace: createWorkspaceMutation.mutate,
    isCreatingWorkspace: createWorkspaceMutation.isPending,
    createProject: createProjectMutation.mutate,
    isCreatingProject: createProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutate,
    isDeletingProject: deleteProjectMutation.isPending,
  };
}
