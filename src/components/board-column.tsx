import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { TaskCard, Task } from './task-card';
import { Button } from './ui/button';
import { useDrop } from 'react-dnd';
import { Input } from './ui/input';

interface BoardColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => void;
  onMoveTask: (taskId: string, targetColumnId: string) => void;
}

export function BoardColumn({
  id,
  title,
  tasks,
  onTaskClick,
  onAddTask,
  onMoveTask,
}: BoardColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string }) => {
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

  return (
    <div
      ref={drop}
      className={`flex-shrink-0 w-80 bg-slate-100 rounded-lg p-3 flex flex-col max-h-full ${
        isOver ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-slate-900">{title}</h3>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="w-4 h-4 text-slate-600" />
        </Button>
      </div>

      {/* Tasks */}
      <div className="flex-1 space-y-2 overflow-y-auto min-h-[200px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
        {isOver && tasks.length === 0 && (
          <div className="h-20 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center text-blue-600">
            Drop here
          </div>
        )}
      </div>

      {/* Add Task */}
      <div className="mt-3">
        {isAddingTask ? (
          <div className="space-y-2">
            <Input
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTask();
                } else if (e.key === 'Escape') {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                }
              }}
              autoFocus
              className="bg-white"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddTask}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add task
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:bg-slate-200"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a task
          </Button>
        )}
      </div>
    </div>
  );
}
