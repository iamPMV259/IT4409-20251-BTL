import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../lib/api';

interface BoardData {
  project: {
    id: string;
    name: string;
    owner_id: string;
    members: Array<{ user_id: string; role: string }>;
    column_order: string[];
  };
  columns: Array<{
    id: string;
    title: string;
    project_id: string;
    tasks: any[];
    created_at: string;
    updated_at: string;
  }>;
}

interface MoveTaskParams {
  taskId: string;
  targetColumnId: string;
  position?: number;
}

export function useProjectBoard(projectId: string) {
  const queryClient = useQueryClient();

  // Main board query với caching
  const boardQuery = useQuery({
    queryKey: ['project-board', projectId],
    queryFn: async () => {
      const response = await projectApi.getBoard(projectId);
      return response.data.data as BoardData;
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Prefetch project labels khi load board
  useQuery({
    queryKey: ['project-labels', projectId],
    queryFn: async () => {
      const response = await projectApi.getLabels(projectId);
      return response.data;
    },
    enabled: !!projectId && !!boardQuery.data,
    staleTime: 5 * 60 * 1000, // Labels ít thay đổi
  });

  // Move task mutation với optimistic update
  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, targetColumnId, position }: MoveTaskParams) => {
      console.log('🔄 [useProjectBoard] Moving task:', { taskId, targetColumnId, position });
      const { taskApi } = await import('../lib/api');
      const response = await taskApi.move(taskId, targetColumnId, position);
      console.log('✅ [useProjectBoard] Task moved successfully:', response.data);
      return response.data;
    },
    onMutate: async ({ taskId, targetColumnId, position }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project-board', projectId] });

      // Snapshot previous value
      const previousBoard = queryClient.getQueryData<BoardData>(['project-board', projectId]);

      // Optimistically update board
      if (previousBoard) {
        queryClient.setQueryData<BoardData>(['project-board', projectId], (old) => {
          if (!old) return old;

          let movedTask: any = null;

          // Remove task from all columns and find it
          const newColumns = old.columns.map((col) => {
            const task = col.tasks.find((t) => t.taskId === taskId);
            if (task) movedTask = task;
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.taskId !== taskId),
            };
          });

          // Add task to target column
          const updatedColumns = newColumns.map((col) => {
            if (col.id === targetColumnId && movedTask) {
              const newTasks = [...col.tasks];
              if (position !== undefined && position >= 0) {
                newTasks.splice(position, 0, movedTask);
              } else {
                newTasks.push(movedTask);
              }
              return { ...col, tasks: newTasks };
            }
            return col;
          });

          return { ...old, columns: updatedColumns };
        });
      }

      return { previousBoard };
    },
    onError: (err: any, variables, context) => {
      console.error('❌ [useProjectBoard] Move task error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Variables:', variables);
      
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['project-board', projectId], context.previousBoard);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] });
    },
  });

  return {
    board: boardQuery.data,
    isLoading: boardQuery.isLoading,
    error: boardQuery.error,
    refetch: boardQuery.refetch,
    moveTask: moveTaskMutation.mutate,
    isMovingTask: moveTaskMutation.isPending,
  };
}
