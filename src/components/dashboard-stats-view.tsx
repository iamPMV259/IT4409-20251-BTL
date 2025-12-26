import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, AlertCircle, Clock, Activity, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useProjectDashboard } from '../hooks/useProjectDashboard';
import { useSocket } from '../context/socket-context';
import { useQueryClient } from '@tanstack/react-query';

interface DashboardStatsViewProps {
  projectId: string;
  projectTitle: string;
  onBack: () => void;
  onFilterBoard?: (status: string) => void;
}

export function DashboardStatsView({
  projectId,
  projectTitle,
  onBack,
  onFilterBoard,
}: DashboardStatsViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch dashboard data from API
  const { data: dashboardData, isLoading, error } = useProjectDashboard(projectId);

  // Socket connection for real-time updates
  const { connectToProject, disconnect, lastJsonMessage } = useSocket();

  // Connect to socket when component mounts
  useEffect(() => {
    if (projectId) {
      connectToProject(projectId);
      console.log('📊 Dashboard connected to socket for project:', projectId);
    }

    return () => {
      disconnect();
      console.log('📊 Dashboard disconnected from socket');
    };
  }, [projectId, connectToProject, disconnect]);

  // Listen for socket events and invalidate dashboard query
  useEffect(() => {
    if (!lastJsonMessage) return;

    // Debug: Log all socket messages
    console.log('📊 Dashboard received socket message:', lastJsonMessage);

    // Backend sends format: { event: "server:task_created", data: {...} }
    const event = lastJsonMessage.event || lastJsonMessage.type;
    
    // Events that should trigger dashboard refresh
    const dashboardEvents = [
      'server:task_created',
      'server:task_updated', 
      'server:task_deleted',
      'server:task_moved',
      'server:assignee_added',
      'server:assignee_removed',
    ];

    if (dashboardEvents.includes(event)) {
      console.log('📊 Dashboard event matched:', event, '- Refreshing stats...');
      // Invalidate dashboard query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['project-dashboard', projectId] });
    } else if (event) {
      console.log('📊 Dashboard event not matched:', event);
    }
  }, [lastJsonMessage, projectId, queryClient]);

  // Transform API data to chart format
  const tasksByStatusData = useMemo(() => {
    if (!dashboardData) return [];
    return [
      { name: 'To Do', value: dashboardData.to_do_tasks, color: '#94a3b8' },
      { name: 'In Progress', value: dashboardData.in_progress_tasks, color: '#3b82f6' },
      { name: 'Review', value: dashboardData.review_tasks, color: '#f59e0b' },
      { name: 'Done', value: dashboardData.done_tasks, color: '#10b981' },
    ];
  }, [dashboardData]);

  const teamWorkloadData = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.team_workload_list.map(member => ({
      name: member.userName,
      tasks: member.taskCount,
    }));
  }, [dashboardData]);

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    if (onFilterBoard) {
      onFilterBoard(status);
    }
    console.log('Filter board by status:', status);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show error state
  if (error || !dashboardData) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Không thể tải dữ liệu dashboard</p>
          <Button onClick={onBack} className="mt-4">Quay lại</Button>
        </div>
      </div>
    );
  }

  const totalTasks = dashboardData.totalTasks;
  const completionRate = Math.round(dashboardData.completion_rate);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
        <p className="text-slate-600">Project insights and analytics</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-slate-600">Total Tasks</CardTitle>
              <Activity className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-slate-900">{totalTasks}</div>
              <p className="text-slate-500 mt-1">Across all columns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-slate-600">In Progress</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-slate-900">
                {dashboardData.in_progress_tasks}
              </div>
              <p className="text-slate-500 mt-1">Active tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-slate-600">Completion Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-slate-900">{completionRate}%</div>
              <p className="text-slate-500 mt-1">Tasks completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-slate-600">Overdue</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-slate-900">{dashboardData.overdue_tasks}</div>
              <p className="text-slate-500 mt-1">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Status */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-900">Tasks by Status</CardTitle>
              <p className="text-slate-600">Distribution across workflow stages</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tasksByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(data) => handleStatusClick(data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {tasksByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {tasksByStatusData.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleStatusClick(item.name)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-700">{item.name}</span>
                    <span className="text-slate-500 ml-auto">{item.value}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-900">Team Workload</CardTitle>
              <p className="text-slate-600">Tasks assigned per team member</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamWorkloadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Overdue Tasks
              </CardTitle>
              <p className="text-slate-600">Tasks that have passed their due date</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.overdue_task_lists.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No overdue tasks</p>
                ) : (
                  dashboardData.overdue_task_lists.map(task => (
                    <div
                      key={task.taskId}
                      className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-medium">{task.taskTitle}</p>
                        {task.taskDescription && (
                          <p className="text-slate-600 text-sm mt-1 line-clamp-2">{task.taskDescription}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.dueDate && (
                            <span className="text-xs text-red-600 font-medium">
                              Due: {new Date(task.dueDate).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Upcoming Deadlines
              </CardTitle>
              <p className="text-slate-600">Tasks due in the next 7 days</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.upcoming_deadlines_7d.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No upcoming deadlines</p>
                ) : (
                  dashboardData.upcoming_deadlines_7d.map(task => (
                    <div
                      key={task.taskId}
                      className="flex items-start justify-between gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-medium">{task.taskTitle}</p>
                        {task.taskDescription && (
                          <p className="text-slate-600 text-sm mt-1 line-clamp-2">{task.taskDescription}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {task.dueDate && (
                          <span className="text-xs text-orange-600 font-medium">
                            {new Date(task.dueDate).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
