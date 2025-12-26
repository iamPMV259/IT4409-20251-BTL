import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CardDetailModal } from './card-detail-modal';
import { Task } from './task-card';
import { useProjectBoard } from '../hooks/useProjectBoard';
import { taskApi } from '../lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CalendarViewProps {
  projectId: string;
  projectTitle: string;
  onBack: () => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

export function CalendarView({ projectId, projectTitle, onBack }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<any>(null);
  
  // Sử dụng React Query hook
  const { board, isLoading, moveTask, isMovingTask } = useProjectBoard(projectId);
  
  // Tổng hợp tất cả tasks từ các columns
  const allTasks = useMemo(() => {
    if (!board?.columns) return [];
    return board.columns.flatMap(column => 
      (column.tasks || []).map(task => ({
        ...task,
        columnId: column.id,
        columnTitle: column.title
      }))
    );
  }, [board]);

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
    return allTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  const handleTaskClick = (task: any) => {
    // Debug log để kiểm tra task data
    console.log('Calendar task clicked:', task);
    
    // Đảm bảo task có đầy đủ thông tin
    if (!task) {
      toast.error('Không thể mở task');
      return;
    }
    
    // Set task ngay lập tức
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    // Close modal sau khi update
    setIsModalOpen(false);
    setSelectedTask(null);
    toast.success('Cập nhật task thành công');
  };
  
  const handleDeleteTask = (taskId: string, columnId: string) => {
    // React Query hook sẽ xử lý
    setIsModalOpen(false);
    toast.success('Đã xóa task');
  };

  const handleDateClick = (date: Date, columnId: string) => {
    if (!columnId && board?.columns?.[0]) {
      columnId = board.columns[0].id; // Mặc định dùng column đầu tiên
    }
    setSelectedDate(date);
    setSelectedColumnId(columnId);
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !selectedDate || !selectedColumnId) {
      toast.error('Vui lòng nhập tên task');
      return;
    }
    
    try {
      await taskApi.create(selectedColumnId, {
        title: newTaskTitle,
        description: '',
        dueDate: selectedDate.toISOString(),
      });
      toast.success('Đã tạo task mới');
      setNewTaskTitle('');
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error('Lỗi tạo task');
      console.error(error);
    }
  };

  const handleDragStart = (task: any, e: React.DragEvent) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTask) return;
    
    const newDueDate = date.toISOString();
    
    try {
      // Cập nhật dueDate qua API
      await taskApi.update(draggedTask.id, { dueDate: newDueDate });
      toast.success('Đã chuyển task sang ' + date.toLocaleDateString('vi-VN'));
      setDraggedTask(null);
    } catch (error) {
      toast.error('Lỗi khi chuyển task');
      console.error(error);
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
    return currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const monthDates = getMonthDates();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center">
        <CalendarIcon className="w-12 h-12 text-slate-400 animate-pulse mb-4" />
        <p className="text-slate-600">Đang tải lịch...</p>
      </div>
    );
  }

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
                Tháng
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Tuần
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Ngày
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hôm nay
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
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="p-3 text-center text-slate-600 font-medium border-r border-slate-200 last:border-r-0">
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
                    key={date.toISOString()}
                    className={`min-h-24 lg:min-h-32 border-r border-b border-slate-200 last:border-r-0 p-2 hover:bg-slate-50 transition-colors ${
                      !isCurrentMonth(date) ? 'bg-slate-50' : 'bg-white'
                    } ${isToday(date) ? 'bg-blue-50' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(date, e)}
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
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDateClick(date, board?.columns?.[0]?.id || '')}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Tasks for this date */}
                    <div className="space-y-1">
                      {dateTasks.slice(0, 3).map((task, taskIndex) => (
                        <div
                          key={task.id || `task-${date.toISOString()}-${taskIndex}`}
                          draggable
                          onDragStart={(e) => handleDragStart(task, e)}
                          onClick={() => handleTaskClick(task)}
                          className="bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded cursor-move hover:shadow-md transition-shadow text-xs"
                        >
                          <p className="truncate font-medium">{task.title}</p>
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {task.labels.slice(0, 2).map((label: any, idx: number) => {
                                const labelId = typeof label === 'string' ? label : (label?.id || `label-${idx}`);
                                return (
                                  <div key={`${task.id || 'task'}-label-${labelId}`} className="w-2 h-2 rounded-full bg-blue-500" />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                      {dateTasks.length > 3 && (
                        <p className="text-slate-500 px-2 text-xs">
                          +{dateTasks.length - 3} task khác
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
            <p className="text-slate-600 text-center">Chế độ xem tuần đang được phát triển</p>
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-center">Chế độ xem ngày đang được phát triển</p>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <CardDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* Create Task Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Task Mới</DialogTitle>
            <DialogDescription>Tạo task mới với ngày đáo hạn đã chọn</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Tên Task</Label>
              <Input
                id="task-title"
                placeholder="Nhập tên task..."
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
              <p className="text-slate-600 text-sm">
                📅 Hạn: {selectedDate.toLocaleDateString('vi-VN', { 
                  day: '2-digit',
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateTask} className="bg-blue-600 hover:bg-blue-700">
              Tạo Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
