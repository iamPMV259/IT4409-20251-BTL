import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Calendar,
  MessageSquare,
  Paperclip,
  CheckSquare,
  AlignLeft,
} from 'lucide-react';
import { useDrag } from 'react-dnd';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignees: { name: string; avatar: string }[];
  dueDate?: string;
  labels: { color: string; name: string }[];
  checklist?: { total: number; completed: number };
  comments: number;
  attachments: number;
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.checklist
      ? task.checklist.completed < task.checklist.total
      : false;

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        isDragging ? 'opacity-50 rotate-3' : ''
      }`}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label, index) => (
            <Badge
              key={index}
              className={`${label.color} text-white border-0 h-2 px-0 w-10`}
            >
              <span className="sr-only">{label.name}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
        {task.title}
      </h4>

      {/* Metadata Icons */}
      <div className="flex items-center gap-3 mb-3 text-slate-500">
        {task.description && (
          <div className="flex items-center gap-1" title="Has description">
            <AlignLeft className="w-4 h-4" />
          </div>
        )}
        {task.checklist && (
          <div
            className="flex items-center gap-1"
            title={`Checklist: ${task.checklist.completed}/${task.checklist.total}`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-slate-600">
              {task.checklist.completed}/{task.checklist.total}
            </span>
          </div>
        )}
        {task.comments > 0 && (
          <div
            className="flex items-center gap-1"
            title={`${task.comments} comments`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-slate-600">{task.comments}</span>
          </div>
        )}
        {task.attachments > 0 && (
          <div
            className="flex items-center gap-1"
            title={`${task.attachments} attachments`}
          >
            <Paperclip className="w-4 h-4" />
            <span className="text-slate-600">{task.attachments}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignees */}
        <div className="flex items-center -space-x-2">
          {task.assignees.map((assignee, index) => (
            <Avatar
              key={index}
              className="w-6 h-6 border-2 border-white"
              title={assignee.name}
            >
              <AvatarImage src={assignee.avatar} alt={assignee.name} />
              <AvatarFallback className="bg-slate-200 text-slate-700">
                {assignee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded text-white ${
              isOverdue
                ? 'bg-red-500'
                : 'bg-slate-400'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
