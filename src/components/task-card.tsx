import React from 'react';
import { useDrag } from 'react-dnd';
import { Calendar, MessageSquare, Paperclip, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Định nghĩa lại Type cho Task để an toàn hơn
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string | null;
  // Cho phép assignees/labels là string (ID) hoặc object
  assignees?: (string | { name: string; avatarUrl?: string })[];
  labels?: (string | { text: string; color: string })[];
  checklists?: any[];
  comments?: number | any[]; // Có thể là số lượng hoặc mảng
  attachments?: number;
}

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // --- 1. XỬ LÝ AN TOÀN NGÀY THÁNG ---
  // Tính khoảng cách với ngày hiện tại theo timestamp (giây)
  const getDaysUntilDue = (): number | null => {
    if (!task.dueDate) return null;
    
    // Lấy timestamp hiện tại (giây)
    const nowTimestamp = Date.now();
    const dueTimestamp = new Date(task.dueDate).getTime();
    
    // Tính chênh lệch theo giây, sau đó convert sang ngày
    const diffInMilliseconds = dueTimestamp - nowTimestamp;
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
    
    // Làm tròn để có số ngày chính xác
    return Math.floor(diffInDays);
  };
  
  const daysUntilDue = getDaysUntilDue();
  
  // Xác định màu dựa trên khoảng cách
  const getDateColor = (): string => {
    if (daysUntilDue === null) return 'text-slate-500';
    
    // Quá hạn (dueDate đã qua)
    if (daysUntilDue < 0) return 'text-gray-700 font-semibold'; // Xám đậm
    
    // Gần đến hạn (0-3 ngày)
    if (daysUntilDue <= 3) return 'text-red-600 font-semibold'; // Đỏ đậm
    
    // Còn lâu (> 3 ngày)
    return 'text-blue-600 font-medium'; // Xanh nước biển đậm
  };
  
  // Kiểm tra kỹ task.dueDate có tồn tại không trước khi format
  const displayDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  // Tính toán số lượng comment (nếu backend trả về mảng hoặc số)
  const commentCount = Array.isArray(task.comments)
    ? task.comments.length
    : (typeof task.comments === 'number' ? task.comments : 0);

  // Tính toán checklist
  const checklistTotal = task.checklists?.length || 0;
  const checklistDone = task.checklists?.filter((c: any) => c.checked).length || 0;

  return (
    <div
      ref={drag}
      onClick={() => onClick(task)}
      className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all group relative ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* --- 2. XỬ LÝ AN TOÀN LABELS --- */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label, idx) => {
             // Logic an toàn: Nếu là object thì lấy color, nếu là ID string thì dùng màu mặc định
             const color = typeof label === 'object' ? label.color : '#cbd5e1';
             const text = typeof label === 'object' ? label.text : '';

             return (
              <div
                key={idx}
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: color }}
                title={text}
              />
             );
          })}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-slate-800 mb-2 leading-tight">
        {task.title}
      </h4>

      {/* Footer info */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-slate-400">
          {/* Due Date */}
          {displayDate && (
            <div className={`flex items-center text-xs ${getDateColor()}`}>
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {displayDate}
            </div>
          )}

          {/* Description Indicator */}
          {task.description && <div title="Có mô tả"><AlignLeftIcon /></div>}

          {/* Comment Count */}
          {commentCount > 0 && (
            <div className="flex items-center text-xs hover:text-slate-600">
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              {commentCount}
            </div>
          )}

          {/* Checklist */}
          {checklistTotal > 0 && (
             <div className={`flex items-center text-xs ${checklistDone === checklistTotal ? 'text-green-600 bg-green-50 px-1 rounded' : ''}`}>
               <CheckSquare className="w-3.5 h-3.5 mr-1" />
               {checklistDone}/{checklistTotal}
             </div>
          )}
        </div>

        {/* --- 3. XỬ LÝ AN TOÀN ASSIGNEES --- */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.map((assignee, idx) => {
               // Logic an toàn:
               // Nếu là Object có name -> Lấy chữ cái đầu
               // Nếu là String (ID) -> Hiển thị 'U' mặc định
               let initials = 'U';
               if (typeof assignee === 'object' && assignee.name) {
                  // ĐÂY LÀ CHỖ GÂY LỖI CŨ: .split() trên undefined
                  initials = assignee.name.split(' ').map((n:string) => n[0]).join('').substring(0,2);
               }

               return (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full bg-blue-100 ring-1 ring-white flex items-center justify-center text-[9px] font-bold text-blue-600 uppercase"
                    title={typeof assignee === 'object' ? assignee.name : 'Thành viên'}
                  >
                    {initials}
                  </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Icon nhỏ cho description
function AlignLeftIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="17" y1="10" x2="3" y2="10"></line>
      <line x1="21" y1="6" x2="3" y2="6"></line>
      <line x1="21" y1="14" x2="3" y2="14"></line>
      <line x1="17" y1="18" x2="3" y2="18"></line>
    </svg>
  );
}