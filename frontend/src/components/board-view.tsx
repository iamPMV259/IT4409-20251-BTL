import React, { useState, useEffect } from 'react';
import { Plus, Filter, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { BoardColumn } from './board-column';
import { CardDetailModal } from './card-detail-modal';
import { Input } from './ui/input';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { taskApi, columnApi, projectApi, Task, CreateTaskPayload, Column as ApiColumn } from '../lib/api';
import { toast } from 'sonner';

// Interface Column cho UI (map từ API Column)
interface BoardColumn {
  id: string;
  title: string;
  tasks: Task[];
}

interface BoardViewProps {
  projectId: string;
  projectTitle: string;
  onBack: () => void;
}

// Detect if touch device
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export function BoardView({ projectId, projectTitle, onBack }: BoardViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [columns, setColumns] = useState<BoardColumn[]>([]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const teamMembers = [
    { name: 'John Doe', avatar: '' },
    { name: 'Jane Smith', avatar: '' },
    { name: 'Bob Wilson', avatar: '' },
    { name: 'Alice Johnson', avatar: '' },
  ];

  // Fetch columns và tasks từ API khi load project
  useEffect(() => {
    const fetchBoardData = async () => {
      setIsLoading(true);
      try {
        // Gọi API lấy chi tiết project (bao gồm columns và tasks)
        const { data: projectData } = await projectApi.getDetail(projectId);
        
        // Map data từ API sang format UI
        // Giả sử projectData.columns chứa danh sách columns với tasks
        if (projectData && Array.isArray((projectData as any).columns)) {
          const boardColumns: BoardColumn[] = (projectData as any).columns.map((col: ApiColumn) => ({
            id: col.id,
            title: col.name,
            tasks: Array.isArray(col.tasks) ? col.tasks : [],
          }));
          setColumns(boardColumns);
        } else {
          // Nếu project chưa có columns, tạo columns mặc định
          try {
            const { data: newColumns } = await projectApi.createDefaultColumns(projectId);
            if (Array.isArray(newColumns)) {
              const boardColumns: BoardColumn[] = newColumns.map((col: ApiColumn) => ({
                id: col.id,
                title: col.name,
                tasks: [],
              }));
              setColumns(boardColumns);
            }
          } catch (createError) {
            console.error("Cannot create default columns:", createError);
            // Fallback: hiển thị board trống
            setColumns([]);
          }
        }
      } catch (error) {
        console.error("Error fetching board data:", error);
        toast.error("Không thể tải dữ liệu bảng");
        setColumns([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchBoardData();
    }
  }, [projectId]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // --- HÀM TẠO TASK MỚI ---
  const handleAddTask = async (columnId: string, title: string) => {
    // 1. Tạo payload cơ bản
    const payload: CreateTaskPayload = {
      title: title,
      description: "", 
      assignees: [],
      labels: []
    };

    try {
      // 2. Gọi API
      const { data: newTask } = await taskApi.create(columnId, payload);

      // 3. Cập nhật State Local (Thêm task vào cột tương ứng)
      setColumns(prevColumns => 
        prevColumns.map(col => {
          if (col.id === columnId) {
            return { ...col, tasks: [...col.tasks, newTask] }; // newTask từ backend đã có đầy đủ ID
          }
          return col;
        })
      );
      toast.success("Thêm thẻ thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo thẻ mới");
    }
  };

  // --- HÀM CẬP NHẬT TASK (Sửa tên, mô tả, dueDate...) ---
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      // 1. Gọi API Update
      // Lọc ra các field cần thiết để gửi lên server (tránh gửi cả object thừa)
      const { data: serverTask } = await taskApi.update(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        dueDate: updatedTask.dueDate,
        // Cần xử lý logic assignees/labels nếu UI đã hỗ trợ chọn
      });

      // 2. Cập nhật State Local
      setColumns(prevColumns => 
        prevColumns.map(col => ({
          ...col,
          tasks: col.tasks.map(t => 
            t.id === updatedTask.id ? { ...t, ...serverTask } : t
          )
        }))
      );
      toast.success("Cập nhật thành công");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật thẻ");
    }
  };

  const handleMoveTask = async (taskId: string, targetColumnId: string) => {
    // 1. Tìm task cần di chuyển
    let movedTask: Task | null = null;
    let sourceColumnId = "";

    // Copy state cũ để revert nếu lỗi (Optimistic Update)
    const originalColumns = [...columns];

    // Cập nhật state UI trước cho mượt
    const newColumns = columns.map((column) => {
      // Tìm và xóa task khỏi cột cũ
      const taskIndex = column.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        movedTask = column.tasks[taskIndex];
        sourceColumnId = column.id;
        return {
          ...column,
          tasks: column.tasks.filter((t) => t.id !== taskId),
        };
      }
      return column;
    });

    if (movedTask && sourceColumnId) {
      // Thêm task vào cột mới (Tạm thời push vào cuối danh sách)
      // Nếu thư viện DnD trả về index thả, hãy dùng index đó. 
      // Ở đây ví dụ thêm vào cuối:
      const targetColumn = newColumns.find(c => c.id === targetColumnId);
      const newPosition = targetColumn ? targetColumn.tasks.length : 0; // Index bắt đầu từ 0

      setColumns(
        newColumns.map((column) =>
          column.id === targetColumnId
            ? { ...column, tasks: [...column.tasks, { ...movedTask!, columnId: targetColumnId }] }
            : column
        )
      );

      // 2. Gọi API Move
      try {
        await taskApi.move(taskId, {
          targetColumnId: targetColumnId,
          position: newPosition 
        });
        // Không cần toast success khi kéo thả để tránh spam
      } catch (error) {
        console.error("Move task failed:", error);
        toast.error("Di chuyển thất bại");
        setColumns(originalColumns); // Revert UI
      }
    }
  };

  const handleAddColumn = () => {
    // Hiện tại API chỉ có createDefaultColumns, không có API tạo column đơn lẻ
    // Tạm thời tạo local, sau này có thể thêm API
    if (newColumnTitle.trim()) {
      setColumns([
        ...columns,
        {
          id: Date.now().toString(),
          title: newColumnTitle,
          tasks: [],
        },
      ]);
      setNewColumnTitle('');
      setIsAddingColumn(false);
      toast.success("Thêm cột thành công");
    }
  };

  // --- HÀM CẬP NHẬT TÊN COLUMN ---
  const handleUpdateColumn = async (columnId: string, newName: string) => {
    try {
      await columnApi.update(columnId, { name: newName });
      setColumns(prevColumns =>
        prevColumns.map(col =>
          col.id === columnId ? { ...col, title: newName } : col
        )
      );
      toast.success("Cập nhật cột thành công");
    } catch (error) {
      console.error("Update column failed:", error);
      toast.error("Không thể cập nhật cột");
    }
  };

  // --- HÀM XÓA COLUMN ---
  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Bạn có chắc muốn xóa cột này? Tất cả thẻ trong cột sẽ bị xóa.")) return;

    try {
      await columnApi.delete(columnId);
      setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId));
      toast.success("Đã xóa cột");
    } catch (error) {
      console.error("Delete column failed:", error);
      toast.error("Không thể xóa cột");
    }
  };

  // --- HÀM XÓA TASK (Cần truyền xuống CardDetailModal hoặc Menu context) ---
  const handleDeleteTask = async (taskId: string, columnId: string) => {
    if (!confirm("Bạn có chắc muốn xóa thẻ này?")) return;

    try {
      await taskApi.delete(taskId);
      
      setColumns(prevColumns => 
        prevColumns.map(col => {
          if (col.id === columnId) {
            return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
          }
          return col;
        })
      );
      toast.success("Đã xóa thẻ");
      setIsModalOpen(false); // Đóng modal nếu đang mở
    } catch (error) {
      toast.error("Không thể xóa thẻ");
    }
  };

  const backend = isTouchDevice() ? TouchBackend : HTML5Backend;

  // Hiển thị loading khi đang fetch data
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-600">Đang tải bảng...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={backend}>
      <div className="flex flex-col h-full bg-slate-50">
        {/* Board Header */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Team Members */}
            <div className="flex items-center -space-x-2">
              {teamMembers.map((member, index) => (
                <Avatar
                  key={index}
                  className="w-8 h-8 border-2 border-white"
                  title={member.name}
                >
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-slate-200 text-slate-700">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-full"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Board Content - Desktop */}
        <div className="hidden lg:flex flex-1 overflow-x-auto overflow-y-hidden p-6 gap-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={column.tasks}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
              onMoveTask={handleMoveTask}
            />
          ))}

          {/* Add Column */}
          {isAddingColumn ? (
            <div className="flex-shrink-0 w-80 bg-slate-100 rounded-lg p-3">
              <Input
                placeholder="Enter list title..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddColumn();
                  } else if (e.key === 'Escape') {
                    setIsAddingColumn(false);
                    setNewColumnTitle('');
                  }
                }}
                autoFocus
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddColumn}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add list
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingColumn(false);
                    setNewColumnTitle('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="flex-shrink-0 w-80 justify-start text-slate-600 hover:bg-slate-200 bg-slate-100/50"
              onClick={() => setIsAddingColumn(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add another list
            </Button>
          )}
        </div>

        {/* Board Content - Mobile */}
        <div className="lg:hidden flex-1 overflow-y-auto p-4 space-y-4">
          {columns.map((column) => (
            <div key={column.id} className="bg-slate-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-slate-900">{column.title}</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {column.tasks.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm"
                  >
                    {task.labels && task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.labels.map((label, index) => (
                          <div
                            key={index}
                            className={`${label.color} h-2 w-10 rounded`}
                          />
                        ))}
                      </div>
                    )}
                    <h4 className="text-slate-900 mb-2">{task.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center -space-x-2">
                        {task.assignees.map((assignee, index) => (
                          <Avatar
                            key={index}
                            className="w-6 h-6 border-2 border-white"
                          >
                            <AvatarImage src={assignee.avatar} />
                            <AvatarFallback className="bg-slate-200 text-slate-700">
                              {assignee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {task.dueDate && (
                        <span className="text-slate-500">
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:bg-slate-200 mt-2"
                onClick={() =>
                  handleAddTask(
                    column.id,
                    prompt('Enter task title:') || 'New Task'
                  )
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add a task
              </Button>
            </div>
          ))}
        </div>

        {/* Card Detail Modal */}
        <CardDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      </div>
    </DndProvider>
  );
}
