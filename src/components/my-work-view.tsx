// src/components/my-work-view.tsx
import React, { useState, useEffect } from 'react';
import { List, Calendar as CalendarIcon, Filter, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Task, taskApi, GetMyTasksParams } from '../lib/api'; // Import từ api.ts
import { toast } from 'sonner';

export function MyWorkView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Filter States
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterThisWeek, setFilterThisWeek] = useState(false);

  // Fetch Tasks function
  const fetchMyTasks = async () => {
    setIsLoading(true);
    try {
      const params: GetMyTasksParams = {};
      if (filterOverdue) params.overdue = true;
      if (filterThisWeek) params.this_week = true;

      const { data } = await taskApi.getMyTasks(params);
      setTasks(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách công việc");
    } finally {
      setIsLoading(false);
    }
  };

  // Effect: Gọi API khi filter thay đổi
  useEffect(() => {
    fetchMyTasks();
  }, [filterOverdue, filterThisWeek]);

  // Helper render
  const renderTaskList = () => {
    if (tasks.length === 0) {
      return <div className="text-center py-10 text-slate-500">Không có công việc nào.</div>;
    }

    return (
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-sm transition flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {/* Check overdue */}
                {task.dueDate && new Date(task.dueDate) < new Date() && (
                  <Badge variant="destructive" className="px-1 py-0 text-[10px]">Overdue</Badge>
                )}
                <h4 className="font-medium text-slate-900">{task.title}</h4>
              </div>
              <p className="text-sm text-slate-500 line-clamp-1">{task.description || "No description"}</p>
              
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3"/> 
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                {/* Hiển thị số lượng checklist nếu có */}
                {task.checklists && task.checklists.length > 0 && (
                   <span>{task.checklists.filter(i => i.checked).length}/{task.checklists.length} check items</span>
                )}
              </div>
            </div>
            
            {/* Project/Labels tags placeholder (Vì API Task trả về ID, cần mapping nếu muốn hiện tên) */}
            <div className="flex flex-col items-end gap-1">
               {/* Có thể map Project Name ở đây nếu có store */}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Công việc của tôi</h1>
          <p className="text-slate-500 text-sm">{tasks.length} tasks assigned to you</p>
        </div>
        
        {/* View Toggles */}
        <div className="flex border rounded-md overflow-hidden">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm flex items-center gap-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white'}`}
          >
            <List size={16} /> List
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 text-sm flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-blue-50 text-blue-600' : 'bg-white'}`}
          >
            <CalendarIcon size={16} /> Calendar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto">
        <Button 
          variant={filterOverdue ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterOverdue(!filterOverdue)}
          className={filterOverdue ? "bg-red-500 hover:bg-red-600" : ""}
        >
          <AlertCircle className="w-4 h-4 mr-2" /> Quá hạn
        </Button>
        <Button 
          variant={filterThisWeek ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterThisWeek(!filterThisWeek)}
        >
          <Clock className="w-4 h-4 mr-2" /> Tuần này
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600"/></div>
        ) : (
          viewMode === 'list' ? renderTaskList() : <div className="text-center text-slate-500 mt-10">Calendar View đang phát triển</div>
        )}
      </div>
    </div>
  );
}