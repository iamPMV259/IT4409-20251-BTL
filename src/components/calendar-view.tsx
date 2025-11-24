import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CardDetailModal } from './card-detail-modal';
import { Task } from './task-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CalendarViewProps {
  projectId: string;
  projectTitle: string;
  onBack: () => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

interface CalendarTask extends Task {
  columnId: string;
}

// Mock data - in a real app this would come from props or context
const MOCK_TASKS: CalendarTask[] = [
  {
    id: '1',
    title: 'Design homepage wireframes',
    description: 'Create low-fidelity wireframes for the homepage',
    assignees: [
      { name: 'John Doe', avatar: '' },
      { name: 'Jane Smith', avatar: '' },
    ],
    dueDate: '2025-10-25',
    labels: [{ color: 'bg-purple-500', name: 'Design' }],
    checklist: { total: 5, completed: 2 },
    comments: 3,
    attachments: 1,
    columnId: 'todo',
  },
  {
    id: '3',
    title: 'Implement user authentication',
    description: 'Add login and signup functionality',
    assignees: [{ name: 'Alice Johnson', avatar: '' }],
    dueDate: '2025-10-30',
    labels: [
      { color: 'bg-blue-500', name: 'Development' },
      { color: 'bg-orange-500', name: 'Urgent' },
    ],
    checklist: { total: 3, completed: 1 },
    comments: 5,
    attachments: 2,
    columnId: 'in-progress',
  },
  {
    id: '7',
    title: 'Update API documentation',
    assignees: [{ name: 'Bob Wilson', avatar: '' }],
    dueDate: '2025-10-28',
    labels: [{ color: 'bg-blue-500', name: 'Development' }],
    comments: 2,
    attachments: 0,
    columnId: 'in-progress',
  },
  {
    id: '8',
    title: 'Client presentation',
    assignees: [{ name: 'John Doe', avatar: '' }],
    dueDate: '2025-11-05',
    labels: [{ color: 'bg-green-500', name: 'Feature' }],
    comments: 1,
    attachments: 2,
    columnId: 'review',
  },
];

export function CalendarView({ projectId, projectTitle, onBack }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [tasks, setTasks] = useState<CalendarTask[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null);

  // Calendar navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar dates for month view
  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const dates = [];
    const currentDateIter = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(currentDateIter));
      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }
    
    return dates;
  };

  // Get tasks for a specific date
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

  const handleTaskClick = (task: CalendarTask) => {
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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim() && selectedDate) {
      const newTask: CalendarTask = {
        id: Date.now().toString(),
        title: newTaskTitle,
        assignees: [],
        labels: [],
        comments: 0,
        attachments: 0,
        dueDate: selectedDate.toISOString().split('T')[0],
        columnId: 'todo',
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setIsCreateModalOpen(false);
    }
  };

  const handleDragStart = (task: CalendarTask) => {
    setDraggedTask(task);
  };

  const handleDrop = (date: Date) => {
    if (draggedTask) {
      const updatedTasks = tasks.map(task =>
        task.id === draggedTask.id
          ? { ...task, dueDate: date.toISOString().split('T')[0] }
          : task
      );
      setTasks(updatedTasks);
      setDraggedTask(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const monthDates = getMonthDates();

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-slate-900">{formatMonthYear()}</h3>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View mode selector */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className={viewMode === 'month' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Day
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg">
                <Button variant="ghost" size="icon" onClick={goToPrevious} className="h-9 w-9">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNext} className="h-9 w-9">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Month View */}
      {viewMode === 'month' && (
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-slate-600 border-r border-slate-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar dates */}
            <div className="grid grid-cols-7">
              {monthDates.map((date, index) => {
                const dateTasks = getTasksForDate(date);
                return (
                  <div
                    key={index}
                    className={`min-h-24 lg:min-h-32 border-r border-b border-slate-200 last:border-r-0 p-2 ${
                      !isCurrentMonth(date) ? 'bg-slate-50' : 'bg-white'
                    } ${isToday(date) ? 'bg-blue-50' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday(date)
                            ? 'bg-blue-600 text-white'
                            : !isCurrentMonth(date)
                            ? 'text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 hover:opacity-100"
                        onClick={() => handleDateClick(date)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Tasks for this date */}
                    <div className="space-y-1">
                      {dateTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onClick={() => handleTaskClick(task)}
                          className={`${
                            task.labels[0]?.color || 'bg-slate-200'
                          } text-white px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          <p className="truncate">{task.title}</p>
                        </div>
                      ))}
                      {dateTasks.length > 3 && (
                        <p className="text-slate-500 px-2">
                          +{dateTasks.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-center">Week view coming soon</p>
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-center">Day view coming soon</p>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <CardDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateTask}
      />

      {/* Create Task Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTask();
                  }
                }}
              />
            </div>
            {selectedDate && (
              <p className="text-slate-600">
                Due date: {selectedDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} className="bg-blue-600 hover:bg-blue-700">
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
