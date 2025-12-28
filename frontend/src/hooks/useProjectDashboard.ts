import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../lib/api';

export interface TaskData {
  taskId: string;
  taskTitle: string;
  taskDescription: string | null;
  dueDate: string | null;
}

export interface AssigneeData {
  userId: string;
  userName: string;
  taskCount: number;
}

export interface DashboardData {
  totalTasks: number;
  to_do_tasks: number;
  in_progress_tasks: number;
  done_tasks: number;
  review_tasks: number;
  overdue_tasks: number;
  overdue_task_lists: TaskData[];
  upcoming_deadlines_7d: TaskData[];
  completion_rate: number;
  team_workload_list: AssigneeData[];
}

export function useProjectDashboard(projectId: string | null) {
  return useQuery({
    queryKey: ['project-dashboard', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await projectApi.getDashboard(projectId);
      return response.data.data as DashboardData;
    },
    enabled: !!projectId,
    staleTime: 3 * 60 * 1000, // 3 minutes - dashboard ít thay đổi
    gcTime: 10 * 60 * 1000,
  });
}
