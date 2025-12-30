import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isPast, isThisWeek, isToday, isTomorrow } from 'date-fns';
import {
    AlertCircle,
    Calendar,
    Calendar as CalendarIcon,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    List,
    Tag,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { useMyTasks } from '../hooks/useMyTasks';
import { Label, ProjectGetData, searchApi, TaskResponse } from '../lib/api';
import { CardDetailModal } from './card-detail-modal';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { cn } from './ui/utils';

type FilterType = 'all' | 'overdue' | 'this-week' | 'no-due-date';
type ViewMode = 'list' | 'calendar';

interface MyWorkViewProps {
  onNavigateToProject?: (projectId: string, projectTitle: string) => void;
}

export function MyWorkView({ onNavigateToProject }: MyWorkViewProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch projects for filter dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['my-projects', user?.id],
    queryFn: async () => {
      const response = await searchApi.getMyProjects();
      return response.data as ProjectGetData[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // Fetch labels for filter dropdown
  const { data: availableLabels = [] } = useQuery({
    queryKey: ['my-labels', user?.id],
    queryFn: async () => {
      const response = await searchApi.getMyLabels();
      return response.data as Label[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // Fetch tasks with filters
  const filters = useMemo(() => {
    const f: any = {};
    if (selectedProjectId !== 'all') f.projectId = selectedProjectId;
    // Filter by label if selected
    if (selectedLabels.length > 0) {
      const selectedLabelId = availableLabels.find(l => l.text === selectedLabels[0])?.id || selectedLabels[0];
      f.labelId = selectedLabelId;
    }
    return f;
  }, [selectedProjectId, selectedLabels, availableLabels]);

  const { data: tasks = [], isLoading } = useMyTasks(filters);

  // Group tasks by status for display
  const groupedTasks = useMemo(() => {
    const groups = {
      overdue: [] as TaskResponse[],
      today: [] as TaskResponse[],
      thisWeek: [] as TaskResponse[],
      later: [] as TaskResponse[],
      noDueDate: [] as TaskResponse[],
    };

    tasks.forEach((task) => {
      if (!task.dueDate) {
        groups.noDueDate.push(task);
      } else {
        const dueDate = new Date(task.dueDate);
        
        if (isPast(dueDate) && !isToday(dueDate)) {
          groups.overdue.push(task);
        } else if (isToday(dueDate)) {
          groups.today.push(task);
        } else if (isThisWeek(dueDate)) {
          groups.thisWeek.push(task);
        } else {
          groups.later.push(task);
        }
      }
    });

    return groups;
  }, [tasks]);

  const taskCounts = useMemo(() => ({
    all: tasks.length,
    overdue: groupedTasks.overdue.length,
    thisWeek: groupedTasks.thisWeek.length + groupedTasks.today.length,
    noDueDate: groupedTasks.noDueDate.length,
  }), [tasks, groupedTasks]);

  // Filter tasks by selectedFilter for display
  const displayedGroups = useMemo(() => {
    if (selectedFilter === 'all') {
      return groupedTasks;
    }
    
    return {
      overdue: selectedFilter === 'overdue' ? groupedTasks.overdue : [],
      today: selectedFilter === 'all' || selectedFilter === 'this-week' ? groupedTasks.today : [],
      thisWeek: selectedFilter === 'this-week' ? groupedTasks.thisWeek : [],
      later: selectedFilter === 'all' ? groupedTasks.later : [],
      noDueDate: selectedFilter === 'no-due-date' ? groupedTasks.noDueDate : [],
    };
  }, [selectedFilter, groupedTasks]);

  // Filter by labels (client-side if multiple labels selected)
  const filteredDisplayedGroups = useMemo(() => {
    if (selectedLabels.length <= 1) {
      return displayedGroups;
    }
    
    const filterByLabels = (taskList: TaskResponse[]) => 
      taskList.filter(task => 
        selectedLabels.some(labelName => 
          task.labels.some((l: any) => 
            (typeof l === 'string' ? l : l.text || l.name) === labelName
          )
        )
      );
    
    return {
      overdue: filterByLabels(displayedGroups.overdue),
      today: filterByLabels(displayedGroups.today),
      thisWeek: filterByLabels(displayedGroups.thisWeek),
      later: filterByLabels(displayedGroups.later),
      noDueDate: filterByLabels(displayedGroups.noDueDate),
    };
  }, [displayedGroups, selectedLabels]);

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
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
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

  const isDateToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || `Project ${projectId.slice(0, 8)}`;
  };

  const getProjectColor = (task: TaskResponse) => {
    const labels = task.labels || [];
    const hasUrgent = labels.some((l: any) => {
      const name = typeof l === 'string' ? l : (l.text || l.name || '');
      return name.toLowerCase().includes('urgent') || name.toLowerCase().includes('critical');
    });
    
    if (hasUrgent) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const handleTaskClick = (task: TaskResponse) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedProjectId('all');
    setSelectedFilter('all');
    setSelectedLabels([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Tasks</h1>
            <p className="text-slate-600 mt-1">{taskCounts.all} tasks assigned to you</p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  "gap-2 rounded-none",
                  viewMode === 'list' && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                <List className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "gap-2 rounded-none",
                  viewMode === 'calendar' && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project Filter */}
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quick Filters */}
          <div className="flex gap-2">
            <FilterButton
              active={selectedFilter === 'all'}
              onClick={() => setSelectedFilter('all')}
              label="All"
              count={taskCounts.all}
            />
            <FilterButton
              active={selectedFilter === 'overdue'}
              onClick={() => setSelectedFilter('overdue')}
              label="Overdue"
              count={taskCounts.overdue}
              variant="danger"
            />
            <FilterButton
              active={selectedFilter === 'this-week'}
              onClick={() => setSelectedFilter('this-week')}
              label="Due This Week"
              count={taskCounts.thisWeek}
            />
            <FilterButton
              active={selectedFilter === 'no-due-date'}
              onClick={() => setSelectedFilter('no-due-date')}
              label="No Due Date"
              count={taskCounts.noDueDate}
            />
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
              {availableLabels.map(label => (
                <DropdownMenuCheckboxItem
                  key={label.id}
                  checked={selectedLabels.includes(label.text)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLabels([...selectedLabels, label.text]);
                    } else {
                      setSelectedLabels(selectedLabels.filter(l => l !== label.text));
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: label.color || '#6b7280' }} 
                    />
                    {label.text}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              {availableLabels.length === 0 && (
                <div className="px-2 py-1 text-sm text-slate-500">No labels available</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {(selectedProjectId !== 'all' || selectedFilter !== 'all' || selectedLabels.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
          {viewMode === 'list' ? (
            <div className="space-y-8">
              {/* Overdue Section */}
              {filteredDisplayedGroups.overdue.length > 0 && (
                <TaskSection
                  title="Overdue"
                  count={filteredDisplayedGroups.overdue.length}
                  icon={<AlertCircle className="w-5 h-5 text-red-600" />}
                  variant="danger"
                >
                  {filteredDisplayedGroups.overdue.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      projectName={getProjectName(task.projectId)}
                      labels={availableLabels}
                      onClick={() => handleTaskClick(task)}
                      onProjectClick={() => onNavigateToProject?.(task.projectId, getProjectName(task.projectId))}
                    />
                  ))}
                </TaskSection>
              )}

              {/* Today Section */}
              {filteredDisplayedGroups.today.length > 0 && (
                <TaskSection
                  title="Today"
                  count={filteredDisplayedGroups.today.length}
                  icon={<Clock className="w-5 h-5 text-orange-600" />}
                >
                  {filteredDisplayedGroups.today.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      projectName={getProjectName(task.projectId)}
                      labels={availableLabels}
                      onClick={() => handleTaskClick(task)}
                      onProjectClick={() => onNavigateToProject?.(task.projectId, getProjectName(task.projectId))}
                    />
                  ))}
                </TaskSection>
              )}

              {/* This Week Section */}
              {filteredDisplayedGroups.thisWeek.length > 0 && (
                <TaskSection
                  title="This Week"
                  count={filteredDisplayedGroups.thisWeek.length}
                  icon={<Calendar className="w-5 h-5 text-slate-600" />}
                >
                  {filteredDisplayedGroups.thisWeek.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      projectName={getProjectName(task.projectId)}
                      labels={availableLabels}
                      onClick={() => handleTaskClick(task)}
                      onProjectClick={() => onNavigateToProject?.(task.projectId, getProjectName(task.projectId))}
                    />
                  ))}
                </TaskSection>
              )}

              {/* Later Section */}
              {filteredDisplayedGroups.later.length > 0 && (
                <TaskSection
                  title="Later"
                  count={filteredDisplayedGroups.later.length}
                  icon={<Clock className="w-5 h-5 text-slate-600" />}
                >
                  {filteredDisplayedGroups.later.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      projectName={getProjectName(task.projectId)}
                      labels={availableLabels}
                      onClick={() => handleTaskClick(task)}
                      onProjectClick={() => onNavigateToProject?.(task.projectId, getProjectName(task.projectId))}
                    />
                  ))}
                </TaskSection>
              )}

              {/* No Due Date Section */}
              {filteredDisplayedGroups.noDueDate.length > 0 && (
                <TaskSection
                  title="No Due Date"
                  count={filteredDisplayedGroups.noDueDate.length}
                  icon={<Tag className="w-5 h-5 text-slate-400" />}
                >
                  {filteredDisplayedGroups.noDueDate.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      projectName={getProjectName(task.projectId)}
                      labels={availableLabels}
                      onClick={() => handleTaskClick(task)}
                      onProjectClick={() => onNavigateToProject?.(task.projectId, getProjectName(task.projectId))}
                    />
                  ))}
                </TaskSection>
              )}

              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks found</h3>
                  <p className="text-slate-600">
                    {selectedFilter === 'all' 
                      ? "You don't have any tasks assigned to you."
                      : "No tasks match the selected filter."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Calendar View */
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Calendar Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
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
                    <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
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
                      const isTodayDate = isDateToday(date);

                      days.push(
                        <div
                          key={day}
                          className={cn(
                            "aspect-square p-2 border rounded-lg transition-colors overflow-hidden",
                            isTodayDate
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "text-sm font-medium mb-1",
                            isTodayDate ? "text-blue-600" : "text-slate-900"
                          )}>
                            {day}
                          </div>
                          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 1.5rem)' }}>
                            {tasksForDay.slice(0, 3).map(task => (
                              <button
                                key={task.id}
                                onClick={() => handleTaskClick(task)}
                                className={cn(
                                  "w-full text-left px-2 py-1 rounded text-white text-xs hover:opacity-80 transition-opacity truncate",
                                  getProjectColor(task)
                                )}
                                title={`${task.title} - ${getProjectName(task.projectId)}`}
                              >
                                {task.title}
                              </button>
                            ))}
                            {tasksForDay.length > 3 && (
                              <div className="text-xs text-slate-600 px-2">
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
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <CardDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onDelete={() => {
            queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

// Helper Components
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  variant?: 'default' | 'danger';
}

function FilterButton({ active, onClick, label, count, variant = 'default' }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
        active
          ? variant === 'danger'
            ? "bg-red-100 text-red-700 border border-red-300"
            : "bg-blue-100 text-blue-700 border border-blue-300"
          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
      )}
    >
      {label} <span className="ml-1">({count})</span>
    </button>
  );
}

interface TaskSectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

function TaskSection({ title, count, icon, children, variant = 'default' }: TaskSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className={cn(
          "text-xl font-bold",
          variant === 'danger' ? "text-red-600" : "text-slate-900"
        )}>
          {title}
        </h2>
        <span className="text-slate-500 text-sm">({count})</span>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: TaskResponse;
  projectName: string;
  labels: Label[];
  onClick: () => void;
  onProjectClick: () => void;
}

function TaskItem({ task, projectName, labels: availableLabels, onClick, onProjectClick }: TaskItemProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  
  // Resolve label names from IDs
  const resolvedLabels = useMemo(() => {
    return (task.labels || [])
      .map((l: any) => {
        if (typeof l === 'string') {
          const found = availableLabels.find(al => al.id === l);
          // Chỉ hiển thị label nếu tìm thấy, ẩn ID
          return found ? { text: found.text, color: found.color } : null;
        }
        return { text: l.text || l.name || '', color: l.color || '#6b7280' };
      })
      .filter(Boolean); // Loại bỏ các label null
  }, [task.labels, availableLabels]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer",
        isOverdue ? "border-l-4 border-l-red-500" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 mb-2 truncate">
            {task.title}
          </h3>
          
          {task.description && (
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
            {/* Project Name */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onProjectClick();
              }}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <span className="text-blue-500">●</span>
              <span>{projectName}</span>
            </button>

            {/* Due Date */}
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-600 font-semibold"
              )}>
                <Calendar className="w-3 h-3" />
                <span>
                  {isToday(new Date(task.dueDate))
                    ? 'Today'
                    : isTomorrow(new Date(task.dueDate))
                    ? 'Tomorrow'
                    : format(new Date(task.dueDate), 'MMM dd')}
                </span>
              </div>
            )}

            {/* Labels */}
            {resolvedLabels.length > 0 && (
              <div className="flex gap-1">
                {resolvedLabels.slice(0, 2).map((label, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs px-2 py-0"
                    style={{ borderColor: label.color, color: label.color }}
                  >
                    {label.text.length > 10 ? label.text.slice(0, 10) + '...' : label.text}
                  </Badge>
                ))}
                {resolvedLabels.length > 2 && (
                  <span className="text-slate-400">+{resolvedLabels.length - 2}</span>
                )}
              </div>
            )}

            {/* Checklist Progress */}
            {task.checklists && task.checklists.length > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  {task.checklists.filter((c: any) => c.checked).length}/{task.checklists.length}
                </span>
              </div>
            )}

            {/* Assignees count */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">👥</span>
                <span>{task.assignees.length} assignee{task.assignees.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
