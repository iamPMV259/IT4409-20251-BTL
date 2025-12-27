import React, { useState, useEffect } from 'react';
import {
  List,
  Calendar as CalendarIcon,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CardDetailModal } from './card-detail-modal';
import { Task } from './task-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { taskApi, Task as ApiTask } from '../lib/api';

type ViewMode = 'list' | 'calendar';
type QuickFilter = 'all' | 'overdue' | 'this-week' | 'no-due-date';

interface MyTask extends Task {
  projectId: string;
  projectName: string;
  projectColor: string;
  status: string;
  estimate?: number;
}

export function MyWorkView() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<MyTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get unique projects
  const projects = Array.from(new Set(tasks.map(t => t.projectName))).map(name => {
    const task = tasks.find(t => t.projectName === name);
    return {
      id: task?.projectId || '',
      name,
      color: task?.projectColor || 'bg-slate-500',
    };
  });

  // Get unique labels
  const allLabels = Array.from(
    new Set(tasks.flatMap(t => t.labels.map(l => l.name)))
  );

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Project filter
    if (selectedProject !== 'all' && task.projectId !== selectedProject) {
      return false;
    }

    // Quick filter
    if (quickFilter === 'overdue') {
      if (!task.dueDate || new Date(task.dueDate) >= new Date()) {
        return false;
      }
    } else if (quickFilter === 'this-week') {
      if (!task.dueDate) return false;
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const taskDate = new Date(task.dueDate);
      if (taskDate < today || taskDate > weekFromNow) {
        return false;
      }
    } else if (quickFilter === 'no-due-date') {
      if (task.dueDate) return false;
    }

    // Label filter
    if (selectedLabels.length > 0) {
      const taskLabelNames = task.labels.map(l => l.name);
      if (!selectedLabels.some(label => taskLabelNames.includes(label))) {
        return false;
      }
    }

    return true;
  });

  // Group tasks by date or project
  const groupedTasks = () => {
    const groups: { [key: string]: MyTask[] } = {};
    
    filteredTasks.forEach(task => {
      let groupKey = 'No Due Date';
      
      if (task.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate < today) {
          groupKey = 'Overdue';
        } else if (taskDate.getTime() === today.getTime()) {
          groupKey = 'Today';
        } else if (taskDate.getTime() === tomorrow.getTime()) {
          groupKey = 'Tomorrow';
        } else if (taskDate < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          groupKey = 'This Week';
        } else {
          groupKey = 'Later';
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    // Sort groups
    const sortOrder = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Later', 'No Due Date'];
    return sortOrder
      .filter(key => groups[key])
      .map(key => ({ group: key, tasks: groups[key] }));
  };

  const handleTaskClick = (task: MyTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id 
        ? { ...task, ...updatedTask }
        : task
    ));
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleEstimateChange = (taskId: string, estimate: number) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, estimate } : task
    ));
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Convert API Task to UI MyTask
  const convertApiTask = (t: ApiTask): MyTask => {
    const assignees = (t.assignees || []).map(a =>
      typeof a === 'string' ? { name: a } : { id: (a as any).id, name: (a as any).name, avatar: (a as any).avatar }
    );

    const labels = (t.labels || []).map(l =>
      typeof l === 'string' ? { name: l, color: 'bg-slate-400' } : { id: (l as any).id, name: (l as any).name, color: (l as any).color || 'bg-slate-400' }
    );

    const projectId = (t as any).projectId || (t as any).project_id || '';
    const projectName = (t as any).projectName || (t as any).project_name || '';
    const projectColor = (t as any).projectColor || (t as any).project_color || 'bg-slate-500';

    const checklist = (t as any).checklist || { total: (t as any).checklists?.length || 0, completed: 0 };

    return {
      id: t.id,
      title: t.title,
      description: t.description || '',
      assignees,
      dueDate: (t as any).dueDate || (t as any).due_date,
      labels,
      checklist,
      comments: t.comments || 0,
      attachments: t.attachments || 0,
      projectId,
      projectName,
      projectColor,
      status: (t as any).status || 'To Do',
      estimate: (t as any).estimate,
    } as MyTask;
  };

  // Fetch tasks from API when filters change
  useEffect(() => {
    let isMounted = true;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedProject !== 'all') params.project_id = selectedProject;
        if (selectedLabels.length > 0) params.label_id = selectedLabels[0];
        if (quickFilter === 'overdue') params.overdue = true;
        if (quickFilter === 'this-week') params.this_week = true;
        if (quickFilter === 'no-due-date') params.no_due_date = true;

        const res = await taskApi.getMyTasks(params);
        if (!isMounted) return;
        const data = res.data || [];
        setTasks(data.map(convertApiTask));
      } catch (err) {
        console.error('Failed to fetch my tasks', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTasks();
    return () => { isMounted = false; };
  }, [selectedProject, selectedLabels, quickFilter]);

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  const getTaskColor = (task: MyTask) => {
    // Check if task has an urgent/critical label
    const urgentLabel = task.labels.find(l => 
      l.name.toLowerCase() === 'urgent' || 
      l.name.toLowerCase() === 'critical'
    );
    
    if (urgentLabel) {
      return urgentLabel.color;
    }
    
    // Otherwise use project color
    return task.projectColor;
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-slate-900">My Tasks</h1>
            <p className="text-slate-600">
              {filteredTasks.length} tasks assigned to you
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`gap-2 ${
                  viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
              >
                <List className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={`gap-2 ${
                  viewMode === 'calendar' ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {/* Project Filter */}
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${project.color}`} />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <Button
              variant={quickFilter === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'overdue' ? 'all' : 'overdue')}
              className={quickFilter === 'overdue' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Overdue
            </Button>
            <Button
              variant={quickFilter === 'this-week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'this-week' ? 'all' : 'this-week')}
              className={quickFilter === 'this-week' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <Clock className="w-4 h-4 mr-2" />
              Due This Week
            </Button>
            <Button
              variant={quickFilter === 'no-due-date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'no-due-date' ? 'all' : 'no-due-date')}
              className={quickFilter === 'no-due-date' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              No Due Date
            </Button>
          </div>

          {/* Label Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Labels
                {selectedLabels.length > 0 && (
                  <Badge className="ml-2 bg-blue-600">{selectedLabels.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Label</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allLabels.map(label => (
                <DropdownMenuCheckboxItem
                  key={label}
                  checked={selectedLabels.includes(label)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLabels([...selectedLabels, label]);
                    } else {
                      setSelectedLabels(selectedLabels.filter(l => l !== label));
                    }
                  }}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {(selectedProject !== 'all' || quickFilter !== 'all' || selectedLabels.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProject('all');
                setQuickFilter('all');
                setSelectedLabels([]);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {viewMode === 'list' ? (
          <div className="max-w-5xl mx-auto space-y-6">
            {groupedTasks().map(({ group, tasks: groupTasks }) => (
              <div key={group} className="space-y-3">
                <h3 className="text-slate-900 flex items-center gap-2">
                  {group}
                  <span className="text-slate-500">({groupTasks.length})</span>
                </h3>
                <div className="space-y-2">
                  {groupTasks.map(task => (
                    <div
                      key={task.id}
                      className="group bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleTaskClick(task)}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${task.projectColor}`} />
                            <span className="text-slate-500">{task.projectName}</span>
                            <Badge variant="outline" className="text-slate-600">
                              {task.status}
                            </Badge>
                          </div>
                          <h4 className="text-slate-900 mb-2">{task.title}</h4>
                          <div className="flex items-center gap-3 flex-wrap">
                            {task.dueDate && (
                              <div
                                className={`flex items-center gap-1 ${
                                  isOverdue(task.dueDate)
                                    ? 'text-red-600'
                                    : 'text-slate-600'
                                }`}
                              >
                                <CalendarIcon className="w-4 h-4" />
                                <span>{formatDueDate(task.dueDate)}</span>
                              </div>
                            )}
                            {task.labels.map((label, idx) => (
                              <Badge
                                key={idx}
                                className={`${label.color} text-white border-0`}
                              >
                                {label.name}
                              </Badge>
                            ))}
                            {task.estimate && (
                              <span className="text-slate-500">
                                {task.estimate}h
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-slate-600">
                              Change Status
                            </DropdownMenuLabel>
                            {['To Do', 'In Progress', 'Review', 'Done'].map(status => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(task.id, status)}
                              >
                                {status}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                const estimate = prompt('Set estimate (hours):', task.estimate?.toString() || '');
                                if (estimate) {
                                  handleEstimateChange(task.id, parseInt(estimate));
                                }
                              }}
                            >
                              Set Estimate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-600">No tasks found</p>
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Calendar Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-slate-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-slate-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
                    const days = [];

                    // Empty cells for days before month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(
                        <div key={`empty-${i}`} className="aspect-square p-2 bg-slate-50 rounded-lg" />
                      );
                    }

                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      const tasksForDay = getTasksForDate(date);
                      const isTodayDate = isToday(date);

                      days.push(
                        <div
                          key={day}
                          className={`aspect-square p-2 border rounded-lg ${
                            isTodayDate
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          } transition-colors overflow-hidden`}
                        >
                          <div className={`mb-1 ${isTodayDate ? 'text-blue-600' : 'text-slate-900'}`}>
                            {day}
                          </div>
                          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 1.5rem)' }}>
                            {tasksForDay.slice(0, 3).map(task => (
                              <button
                                key={task.id}
                                onClick={() => handleTaskClick(task)}
                                className={`w-full text-left px-2 py-1 rounded text-white hover:opacity-80 transition-opacity ${getTaskColor(task)}`}
                                title={`${task.title} - ${task.projectName}`}
                              >
                                <div className="truncate text-white">{task.title}</div>
                                <div className="truncate text-white/90">{task.projectName}</div>
                              </button>
                            ))}
                            {tasksForDay.length > 3 && (
                              <div className="text-slate-600 px-2">
                                +{tasksForDay.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return days;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <CardDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
}
