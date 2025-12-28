import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';
import { taskApi, TaskResponse } from '../lib/api';

interface UseMyTasksOptions {
  projectId?: string;
  labelId?: string;
  noDueDate?: boolean;
  overdue?: boolean;
  thisWeek?: boolean;
}

export function useMyTasks(filters: UseMyTasksOptions = {}) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-tasks', user?.id, filters],
    queryFn: async () => {
      const params: any = {};
      
      if (filters.projectId) params.project_id = filters.projectId;
      if (filters.labelId) params.label_id = filters.labelId;
      if (filters.noDueDate !== undefined) params.no_due_date = filters.noDueDate;
      if (filters.overdue !== undefined) params.overdue = filters.overdue;
      if (filters.thisWeek !== undefined) params.this_week = filters.thisWeek;

      const response = await taskApi.getMyTasks(params);
      return response.data as TaskResponse[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!user, // Only fetch when user is logged in
  });
}
