import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { MoreHorizontal, Plus, Trash2, Edit2 } from 'lucide-react';
import { TaskCard, Task } from './task-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface BoardColumnProps {
  id: string; // id thay vì column.id
  title: string; // title trực tiếp
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => void;
  onMoveTask: (taskId: string, targetColumnId: string, newIndex?: number) => void;
  // Callback mới
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

export function BoardColumn({
  id,
  title,
  tasks,
  onTaskClick,
  onAddTask,
  onMoveTask,
  onRename,
  onDelete,
}: BoardColumnProps) {
  
  // State thêm task
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // State sửa tên cột
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string }) => {
      // Logic drop task cơ bản, xử lý chi tiết index ở BoardView hoặc TaskCard
      onMoveTask(item.id, id); 
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(id, newTaskTitle);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleSaveRename = () => {
    if (tempTitle.trim() && tempTitle !== title) {
        onRename(tempTitle);
    } else {
        setTempTitle(title); // Revert nếu rỗng hoặc không đổi
    }
    setIsRenaming(false);
  };

  return (
    <div
      ref={drop}
      className={`shrink-0 w-80 flex flex-col h-full max-h-full rounded-xl transition-colors ${
        isOver ? 'bg-blue-50/50 ring-2 ring-blue-400 ring-inset' : 'bg-slate-100/50'
      }`}
    >
      {/* COLUMN HEADER */}
      <div className="p-3 flex items-center justify-between group">
        {isRenaming ? (
            <div className="flex items-center gap-1 w-full animate-in fade-in zoom-in-95 duration-200">
                <Input 
                    value={tempTitle} 
                    onChange={e => setTempTitle(e.target.value)}
                    className="h-8 text-sm font-semibold bg-white shadow-sm"
                    autoFocus
                    onBlur={handleSaveRename} // Click ra ngoài tự lưu
                    onKeyDown={e => e.key === 'Enter' && handleSaveRename()}
                />
            </div>
        ) : (
            <div className="flex items-center gap-2 overflow-hidden">
                <h3 className="font-bold text-slate-700 text-sm truncate px-1">{title}</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </div>
        )}

        {/* Dropdown Menu Actions */}
        {!isRenaming && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => {
                    setTempTitle(title);
                    setIsRenaming(true);
                }}>
                    <Edit2 className="w-4 h-4 mr-2" /> Đổi tên cột
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                    if(confirm("Bạn chắc chắn muốn xóa cột này và toàn bộ task bên trong?")) onDelete();
                }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa cột
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>

      {/* TASK LIST CONTAINER */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
        {tasks.map((task, idx) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            index={idx} 
            onClick={() => onTaskClick(task)} 
          />
        ))}
        
        {/* ADD TASK AREA */}
        <div className="mt-2">
            {isAddingTask ? (
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                    <Input
                        placeholder="Nhập tên thẻ..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask();
                            if (e.key === 'Escape') setIsAddingTask(false);
                        }}
                        autoFocus
                        className="mb-2 text-sm"
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-700 h-8 text-xs">Thêm thẻ</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)} className="h-8 text-xs">Hủy</Button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAddingTask(true)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-slate-300/50"
                >
                    <Plus className="w-4 h-4" /> Thêm thẻ
                </button>
            )}
        </div>
      </div>
    </div>
  );
}