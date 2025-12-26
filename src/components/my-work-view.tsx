import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Tag, List, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { CardDetailModal } from './card-detail-modal';
import { useMyTasks } from '../hooks/useMyTasks';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { cn } from './ui/utils';
import { useQueryClient } from '@tanstack/react-query';

type FilterType = 'all' | 'overdue' | 'this-week' | 'no-due-date';

interface MyWorkViewProps {
  onNavigateToProject?: (projectId: string, projectTitle: string) => void;
}

export function MyWorkView({ onNavigateToProject }: MyWorkViewProps) {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Fetch tasks with filters
  const filters = useMemo(() => {
    const f: any = {};
    if (selectedProjectId !== 'all') f.projectId = selectedProjectId;
    if (selectedFilter === 'overdue') f.overdue = true;
    if (selectedFilter === 'this-week') f.thisWeek = true;
    if (selectedFilter === 'no-due-date') f.noDueDate = true;
    return f;
  }, [selectedProjectId, selectedFilter]);

  const { data: tasks = [], isLoading } = useMyTasks(filters);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups = {
      overdue: [] as typeof tasks,
      today: [] as typeof tasks,
      thisWeek: [] as typeof tasks,
      later: [] as typeof tasks,
      noDueDate: [] as typeof tasks,
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
    thisWeek: groupedTasks.thisWeek.length,
    noDueDate: groupedTasks.noDueDate.length,
  }), [tasks, groupedTasks]);

  const handleTaskClick = (task: typeof tasks[0]) => {
    setSelectedTask(task);
    setIsModalOpen(true);
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
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Tasks</h1>
            <p className="text-slate-600 mt-1">{taskCounts.all} tasks assigned to you</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
            </SelectContent>
          </Select>

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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-6">
        {viewMode === 'list' ? (
          <div className="space-y-8">
            {/* Overdue Section */}
            {groupedTasks.overdue.length > 0 && (
              <TaskSection
                title="Overdue"
                count={groupedTasks.overdue.length}
                icon={<AlertCircle className="w-5 h-5 text-red-600" />}
                variant="danger"
              >
                {groupedTasks.overdue.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onProjectClick={() => onNavigateToProject?.(task.projectId, `Project ${task.projectId.slice(0, 8)}`)}
                  />
                ))}
              </TaskSection>
            )}

            {/* This Week Section */}
            {groupedTasks.thisWeek.length > 0 && (
              <TaskSection
                title="Due This Week"
                count={groupedTasks.thisWeek.length}
                icon={<Calendar className="w-5 h-5 text-slate-600" />}
              >
                {groupedTasks.thisWeek.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onProjectClick={() => onNavigateToProject?.(task.projectId, `Project ${task.projectId.slice(0, 8)}`)}
                  />
                ))}
              </TaskSection>
            )}

            {/* Later Section */}
            {groupedTasks.later.length > 0 && (
              <TaskSection
                title="Later"
                count={groupedTasks.later.length}
                icon={<Clock className="w-5 h-5 text-slate-600" />}
              >
                {groupedTasks.later.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onProjectClick={() => onNavigateToProject?.(task.projectId, `Project ${task.projectId.slice(0, 8)}`)}
                  />
                ))}
              </TaskSection>
            )}

            {/* No Due Date Section */}
            {groupedTasks.noDueDate.length > 0 && (
              <TaskSection
                title="No Due Date"
                count={groupedTasks.noDueDate.length}
                icon={<Tag className="w-5 h-5 text-slate-400" />}
              >
                {groupedTasks.noDueDate.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onProjectClick={() => onNavigateToProject?.(task.projectId, `Project ${task.projectId.slice(0, 8)}`)}
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
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Calendar view coming soon...</p>
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
            // Invalidate my-tasks cache to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onDelete={() => {
            // Invalidate my-tasks cache to remove deleted task
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
  task: any;
  onClick: () => void;
  onProjectClick: () => void;
}

function TaskItem({ task, onClick, onProjectClick }: TaskItemProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  
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
              <span>Project {task.projectId.slice(0, 8)}</span>
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
            {task.labels && task.labels.length > 0 && (
              <div className="flex gap-1">
                {task.labels.slice(0, 2).map((label: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs px-2 py-0">
                    {label.length > 10 ? label.slice(0, 10) + '...' : label}
                  </Badge>
                ))}
                {task.labels.length > 2 && (
                  <span className="text-slate-400">+{task.labels.length - 2}</span>
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

            {/* Assignees count - hiển thị số lượng người được gán */}
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