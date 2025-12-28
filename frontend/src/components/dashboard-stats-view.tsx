import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Clock, Activity } from 'lucide-react';
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

interface DashboardStatsViewProps {
  projectId: string;
  projectTitle: string;
  onBack: () => void;
  onFilterBoard?: (status: string) => void;
}

// Mock data for charts and widgets
const tasksByStatusData = [
  { name: 'To Do', value: 12, color: '#94a3b8' },
  { name: 'In Progress', value: 8, color: '#3b82f6' },
  { name: 'Review', value: 5, color: '#f59e0b' },
  { name: 'Done', value: 24, color: '#10b981' },
];

const teamWorkloadData = [
  { name: 'John Doe', tasks: 8 },
  { name: 'Jane Smith', tasks: 12 },
  { name: 'Bob Wilson', tasks: 6 },
  { name: 'Alice Johnson', tasks: 9 },
];

const overdueTasks = [
  {
    id: '1',
    title: 'Fix critical bug in payment flow',
    dueDate: '2025-10-20',
    assignee: 'John Doe',
    labels: [{ color: 'bg-red-500', name: 'Critical' }],
  },
  {
    id: '2',
    title: 'Update security dependencies',
    dueDate: '2025-10-21',
    assignee: 'Bob Wilson',
    labels: [{ color: 'bg-orange-500', name: 'Urgent' }],
  },
  {
    id: '3',
    title: 'Review pull request #234',
    dueDate: '2025-10-22',
    assignee: 'Jane Smith',
    labels: [{ color: 'bg-blue-500', name: 'Development' }],
  },
];

const upcomingDeadlines = [
  {
    id: '4',
    title: 'Complete homepage redesign',
    dueDate: '2025-10-25',
    assignee: 'John Doe',
    labels: [{ color: 'bg-purple-500', name: 'Design' }],
  },
  {
    id: '5',
    title: 'Implement user authentication',
    dueDate: '2025-10-27',
    assignee: 'Alice Johnson',
    labels: [{ color: 'bg-blue-500', name: 'Development' }],
  },
  {
    id: '6',
    title: 'Deploy to staging environment',
    dueDate: '2025-10-28',
    assignee: 'Bob Wilson',
    labels: [{ color: 'bg-green-500', name: 'DevOps' }],
  },
  {
    id: '7',
    title: 'Client presentation preparation',
    dueDate: '2025-10-29',
    assignee: 'Jane Smith',
    labels: [{ color: 'bg-yellow-500', name: 'Meeting' }],
  },
];

const recentActivity = [
  {
    id: '1',
    user: 'Jane Smith',
    action: 'moved',
    task: 'Implement user authentication',
    from: 'To Do',
    to: 'In Progress',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    user: 'John Doe',
    action: 'completed',
    task: 'Design homepage wireframes',
    timestamp: '3 hours ago',
  },
  {
    id: '3',
    user: 'Bob Wilson',
    action: 'commented on',
    task: 'Fix critical bug',
    timestamp: '5 hours ago',
  },
  {
    id: '4',
    user: 'Alice Johnson',
    action: 'added',
    task: 'New API endpoint documentation',
    timestamp: '6 hours ago',
  },
  {
    id: '5',
    user: 'John Doe',
    action: 'updated',
    task: 'Review design system',
    timestamp: '1 day ago',
  },
];

export function DashboardStatsView({
  projectId,
  projectTitle,
  onBack,
  onFilterBoard,
}: DashboardStatsViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    if (onFilterBoard) {
      onFilterBoard(status);
    }
    // In a real implementation, this would navigate to board view with filter
    console.log('Filter board by status:', status);
  };

  const totalTasks = tasksByStatusData.reduce((sum, item) => sum + item.value, 0);
  const completionRate = Math.round((tasksByStatusData.find(d => d.name === 'Done')?.value || 0) / totalTasks * 100);

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
                {tasksByStatusData.find(d => d.name === 'In Progress')?.value || 0}
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
              <div className="text-slate-900">{overdueTasks.length}</div>
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
                {overdueTasks.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No overdue tasks</p>
                ) : (
                  overdueTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-red-600">
                            Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{task.assignee}</span>
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
                {upcomingDeadlines.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {task.labels.map((label, idx) => (
                          <Badge
                            key={idx}
                            className={`${label.color} text-white border-0`}
                          >
                            {label.name}
                          </Badge>
                        ))}
                        <span className="text-slate-600">{task.assignee}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-slate-600">
                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Recent Activity
              </CardTitle>
              <p className="text-slate-600">Latest updates and changes to tasks</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" alt={activity.user} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {activity.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-slate-900">
                        <span>{activity.user}</span>{' '}
                        <span className="text-slate-600">{activity.action}</span>{' '}
                        <span>{activity.task}</span>
                        {activity.from && activity.to && (
                          <>
                            {' '}
                            <span className="text-slate-600">from</span>{' '}
                            <Badge variant="outline">{activity.from}</Badge>{' '}
                            <span className="text-slate-600">to</span>{' '}
                            <Badge variant="outline">{activity.to}</Badge>
                          </>
                        )}
                      </p>
                      <p className="text-slate-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
