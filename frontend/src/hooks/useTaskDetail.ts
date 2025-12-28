import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, TaskResponse } from '../lib/api';

export function useTaskDetail(taskId: string | null) {
  const queryClient = useQueryClient();

  // Query task detail
  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const response = await taskApi.getDetail(taskId);
      return response.data as TaskResponse;
    },
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<TaskResponse>) => {
      if (!taskId) throw new Error('No task ID');
      const response = await taskApi.update(taskId, updates);
      return response.data;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['task', taskId] });
      const previousTask = queryClient.getQueryData(['task', taskId]);

      // Optimistically update
      queryClient.setQueryData(['task', taskId], (old: any) => ({
        ...old,
        ...updates,
      }));

      return { previousTask };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['task', taskId], context.previousTask);
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-board'] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!taskId) throw new Error('No task ID');
      const response = await taskApi.addComment(taskId, content);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  // Add assignee mutation
  const addAssigneeMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!taskId) throw new Error('No task ID');
      const response = await taskApi.addAssignee(taskId, userId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-board'] });
    },
  });

  // Remove assignee mutation
  const removeAssigneeMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!taskId) throw new Error('No task ID');
      const response = await taskApi.removeAssignee(taskId, userId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-board'] });
    },
  });

  // Add label mutation
  const addLabelMutation = useMutation({
    mutationFn: async (labelId: string) => {
      if (!taskId) throw new Error('No task ID');
      const response = await taskApi.addLabel(taskId, labelId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-board'] });
    },
  });

  // Add checklist item mutation
  const addChecklistItemMutation = useMutation({
    mutationFn: async ({ text, checked }: { text: string; checked?: boolean }) => {
      if (!taskId) throw new Error('No task ID');
      const response = await taskApi.addChecklistItem(taskId, text, checked);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  // Update checklist item mutation
  const updateChecklistItemMutation = useMutation({
    mutationFn: async ({
      index,
      text,
      checked,
    }: {
      index: number;
      text?: string;
      checked?: boolean;
    }) => {
      if (!taskId) throw new Error('No task ID');
      const response = await taskApi.updateChecklistItem(taskId, index, { text, checked });
      return response.data;
    },
    onMutate: async ({ index, text, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['task', taskId] });
      const previousTask = queryClient.getQueryData<TaskResponse>(['task', taskId]);

      // Optimistically update checklist
      if (previousTask) {
        queryClient.setQueryData<TaskResponse>(['task', taskId], (old) => {
          if (!old) return old;
          const newChecklists = [...(old.checklists || [])];
          if (newChecklists[index]) {
            newChecklists[index] = {
              ...newChecklists[index],
              ...(text !== undefined && { text }),
              ...(checked !== undefined && { checked }),
            };
          }
          return { ...old, checklists: newChecklists };
        });
      }

      return { previousTask };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['task', taskId], context.previousTask);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskId) throw new Error('No task ID');
      const response = await taskApi.delete(taskId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-board'] });
      queryClient.removeQueries({ queryKey: ['task', taskId] });
    },
  });

  return {
    task: taskQuery.data,
    isLoading: taskQuery.isLoading,
    error: taskQuery.error,
    updateTask: updateTaskMutation.mutate,
    isUpdating: updateTaskMutation.isPending,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    addAssignee: addAssigneeMutation.mutate,
    removeAssignee: removeAssigneeMutation.mutate,
    addLabel: addLabelMutation.mutate,
    addChecklistItem: addChecklistItemMutation.mutate,
    updateChecklistItem: updateChecklistItemMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isDeletingTask: deleteTaskMutation.isPending,
  };
}
