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
import { Task, TaskAssignee, TaskLabel } from '../lib/api';

// Re-export Task để các file khác có thể import từ đây
export type { Task };

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

// Helper để lấy assignees dạng object
const getAssignees = (assignees: TaskAssignee[] | string[]): TaskAssignee[] => {
  if (!assignees || assignees.length === 0) return [];
  if (typeof assignees[0] === 'string') {
    // Nếu là string[], convert sang object với tên mặc định
    return (assignees as string[]).map(id => ({ id, name: id.slice(0, 8), avatar: '' }));
  }
  return assignees as TaskAssignee[];
};

// Helper để lấy labels dạng object
const getLabels = (labels: TaskLabel[] | string[]): TaskLabel[] => {
  if (!labels || labels.length === 0) return [];
  if (typeof labels[0] === 'string') {
    // Nếu là string[], convert sang object với color mặc định
    return (labels as string[]).map(id => ({ id, name: id, color: 'bg-gray-500' }));
  }
  return labels as TaskLabel[];
};

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

  // Chuyển đổi sang format UI
  const displayLabels = getLabels(task.labels);
  const displayAssignees = getAssignees(task.assignees);

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        isDragging ? 'opacity-50 rotate-3' : ''
      }`}
    >
      {/* Labels */}
      {displayLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {displayLabels.map((label, index) => (
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
        {task.comments && task.comments > 0 && (
          <div
            className="flex items-center gap-1"
            title={`${task.comments} comments`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-slate-600">{task.comments}</span>
          </div>
        )}
        {task.attachments && task.attachments > 0 && (
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
          {displayAssignees.map((assignee, index) => (
            <Avatar
              key={index}
              className="w-6 h-6 border-2 border-white"
              title={assignee.name}
            >
              <AvatarImage src={assignee.avatar || ''} alt={assignee.name} />
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
