import React, { useState, useEffect } from "react";
import {
Plus, ArrowLeft, Loader2, UserPlus, Settings, Tag, 
  Search, Filter, CalendarClock, User
} from "lucide-react";
import { Button } from "./ui/button";
import { BoardColumn } from "./board-column";
import { CardDetailModal } from "./card-detail-modal";
import { Task } from "./task-card";
import { Input } from "./ui/input";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { ProjectSettingsDialog } from "./project-settings-dialog";
import { LabelManagementDialog } from "./label-management-dialog";
import {
  projectApi,
  taskApi,
  columnApi, // Import API Column
} from "../lib/api";
import { toast } from "sonner";
import { useSocket } from "../context/socket-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

// Type UI cho Column
interface UIColumn {
  id: string;
  title: string;
  tasks: Task[];
}

interface BoardViewProps {
  projectId: string;
  projectTitle: string;
  projectDesc?: string;
  onBack: () => void;
}

const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

export function BoardView({
  projectId,
  projectTitle: initialTitle,
  projectDesc: initialDescription,
  onBack,
}: BoardViewProps) {
  const [columns, setColumns] = useState<UIColumn[]>([]);
  const [projectTitle, setProjectTitle] = useState(initialTitle);
  const [projectDesc, setProjectDesc] = useState(initialDescription || "");
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Invite States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { connectToProject, disconnect, lastJsonMessage } = useSocket();
  const [isLabelMgrOpen, setIsLabelMgrOpen] = useState(false); // State cho Label Dialog

  useEffect(() => {
    if (projectId) connectToProject(projectId);
    return () => disconnect();
  }, [projectId, connectToProject, disconnect]);

  // 3. XỬ LÝ SỰ KIỆN TỪ SERVER (Trái tim của Realtime)
  useEffect(() => {
    if (lastJsonMessage !== null) {
      const { event, data } = lastJsonMessage;
      console.log("🔔 Socket Event Received:", event, data);

      switch (event) {
        // --- PHẦN 1: PROJECT ---
        case "client:join_project_room":
          console.log(`Đã vào phòng dự án: ${data.project_id}`);
          break;

        case "server:project_updated":
          if (data.name) setProjectTitle(data.name);

          // Cập nhật mô tả (QUAN TRỌNG: Kiểm tra !== undefined để cho phép set rỗng)
          if (data.description !== undefined) {
            setProjectDesc(data.description);
          }

          toast.info(`Thông tin dự án đã được cập nhật`);
          break;

        case "server:project_description_updated":
          setProjectDesc(data.description);
          toast.info(`Mô tả dự án đã được cập nhật.`);
          break;

        // --- PHẦN 2: COLUMNS ---
        case "server:column_created":
          setColumns((prev) => {
            if (prev.some((c) => c.id === data.columnId)) return prev;
            return [
              ...prev,
              { id: data.columnId, title: data.title, tasks: [] },
            ];
          });
          break;

        case "server:column_updated":
          setColumns((prev) =>
            prev.map((col) =>
              col.id === data.columnId ? { ...col, title: data.title } : col
            )
          );
          break;

        case "server:column_deleted":
          setColumns((prev) => prev.filter((col) => col.id !== data.columnId));
          break;

        // --- PHẦN 3: TASKS ---
        case "server:task_created":
          setColumns((prev) =>
            prev.map((col) => {
              if (col.id === data.columnId) {
                // Check trùng để tránh duplicate
                if (col.tasks.some((t) => t.id === data.id)) return col;

                const newTask = {
                  id: data.id,
                  title: data.title,
                  description: data.description || "",
                  dueDate: data.dueDate,
                  assignees: data.assignees || [],
                  labels: data.labels || [],
                  checklists: [],
                  comments: 0,
                  attachments: 0,
                  priority: "medium",
                };
                return { ...col, tasks: [...col.tasks, newTask] };
              }
              return col;
            })
          );
          break;

        case "server:task_updated":
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) => {
                if (t.id === data.id) {
                  // Merge thông tin mới
                  return { ...t, ...data };
                }
                return t;
              }),
            }))
          );
          break;

        case "server:task_moved":
          handleServerTaskMove(data);
          break;

        case "server:task_deleted":
          setColumns((prev) =>
            prev.map((col) => {
              if (col.id === data.columnId) {
                return {
                  ...col,
                  tasks: col.tasks.filter((t) => t.id !== data.taskId),
                };
              }
              return col;
            })
          );
          break;

        case "server:comment_added":
          // Nếu đang mở Modal Task đúng task này -> Cập nhật comment (xử lý ở bước 3)
          // Ở BoardView, ta có thể hiện thông báo nhỏ
          toast.info(`💬 Có bình luận mới trong thẻ`);

          // Cập nhật count comment trong column (nếu UI có hiển thị số comment)
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) => {
                if (t.id === data.taskId) {
                  return { ...t, comments: (t.comments || 0) + 1 };
                }
                return t;
              }),
            }))
          );
          break;

        default:
          console.log("Unhandled event:", event);
      }
    }
  }, [lastJsonMessage]);

  // 4. Logic xử lý Task Move từ Server (Khá phức tạp nên tách riêng)
  const handleServerTaskMove = (data: any) => {
    const { taskId, sourceColumnId, destColumnId, newPosition } = data;

    setColumns((prevColumns) => {
      // Clone deep một chút để an toàn
      const newCols = [...prevColumns];

      const sourceColIndex = newCols.findIndex((c) => c.id === sourceColumnId);
      const destColIndex = newCols.findIndex((c) => c.id === destColumnId);

      if (sourceColIndex === -1 || destColIndex === -1) return prevColumns;

      const sourceCol = {
        ...newCols[sourceColIndex],
        tasks: [...newCols[sourceColIndex].tasks],
      };
      const destCol = {
        ...newCols[destColIndex],
        tasks: [...newCols[destColIndex].tasks],
      };

      // Tìm và xóa task ở cột nguồn
      const taskIndex = sourceCol.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prevColumns; // Không tìm thấy task

      const [movedTask] = sourceCol.tasks.splice(taskIndex, 1);

      // Chèn task vào cột đích
      // Nếu cột nguồn và đích trùng nhau -> Xử lý index cẩn thận (đã được splice nên index có thể thay đổi)
      if (sourceColumnId === destColumnId) {
        sourceCol.tasks.splice(newPosition, 0, movedTask);
        newCols[sourceColIndex] = sourceCol;
      } else {
        destCol.tasks.splice(newPosition, 0, movedTask);
        newCols[sourceColIndex] = sourceCol;
        newCols[destColIndex] = destCol;
      }

      return newCols;
    });
  };

  // API Call: Fetch Board
  useEffect(() => {
    const fetchBoard = async () => {
      setIsLoading(true);
      try {
        // --- SỬA LỖI 2: Gọi song song Get Board và Get Detail ---
        // Get Detail để lấy Description chính xác (vì API Board có thể thiếu)
        const [boardRes, detailRes] = await Promise.all([
          projectApi.getBoard(projectId),
          projectApi.getDetail(projectId).catch(() => ({ data: null })), // Catch lỗi nếu không phải owner
        ]);

        if (boardRes.data.success) {
          const boardData = boardRes.data.data;
          const detailData = detailRes.data?.data; // Dữ liệu chi tiết dự án

          setProjectTitle(boardData.project.name);

          // Ưu tiên lấy description từ API Detail, nếu không có thì lấy từ Board, cuối cùng là rỗng
          setProjectDesc(
            detailData?.description || boardData.project.description || ""
          );

          const formattedColumns: UIColumn[] = boardData.columns.map((col) => ({
            id: col.id,
            title: col.title,
            tasks: (col.tasks || []).map((t) => ({
              id: t.id || (t as any)._id || (t as any).taskId,
              columnId: col.id, // Quan trọng cho logic xóa
              title: t.title,
              description: t.description || "",
              priority: "medium",
              dueDate: t.dueDate,
              assignees: t.assignees || [],
              labels: t.labels || [],
              checklists: t.checklists || [],
              comments: t.comments || [],
              attachments: 0,
            })),
          }));

          const order = boardData.project.column_order || [];
          if (order.length > 0) {
            formattedColumns.sort(
              (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
            );
          }
          setColumns(formattedColumns);
        }
      } catch (error) {
        toast.error("Không thể tải bảng công việc");
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) fetchBoard();
  }, [projectId]);


  // --- COLUMN ACTIONS ---

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    try {
      const { data } = await columnApi.create(projectId, newColumnTitle);
      toast.success("Đã tạo cột mới");
      // UI update (nếu socket chưa kịp)
      const newCol = data.data
        ? { id: data.data.id, title: data.data.title, tasks: [] }
        : null;
      if (newCol) setColumns([...columns, newCol]);

      setNewColumnTitle("");
      setIsAddingColumn(false);
    } catch (error) {
      toast.error("Lỗi tạo cột");
    }
  };

  const handleRenameColumn = async (columnId: string, newTitle: string) => {
    try {
      await columnApi.update(columnId, newTitle);
      setColumns((prev) =>
        prev.map((c) => (c.id === columnId ? { ...c, title: newTitle } : c))
      );
      toast.success("Đã đổi tên cột");
    } catch (error) {
      toast.error("Lỗi đổi tên cột");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await columnApi.delete(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      toast.success("Đã xóa cột");
    } catch (error) {
      toast.error("Lỗi xóa cột");
    }
  };

  // --- TASK ACTIONS ---
  const handleAddTask = async (columnId: string, title: string) => {
    try {
      // 1. Chỉ gọi API để tạo task
      await taskApi.create(columnId, { title });

      // 2. KHÔNG setColumns ở đây nữa.
      // Socket 'server:task_created' sẽ tự động nhận event và vẽ task lên Board.
      // Điều này giúp tránh việc render 2 lần.

      toast.success("Đã tạo thẻ");
    } catch (error) {
      toast.error("Lỗi tạo thẻ");
    }
  };

  // UI Handlers
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTaskInList = (updatedTask: Task) => {
    // Cập nhật State React ngay lập tức
    setColumns((prevColumns) =>
      prevColumns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => {
          // Tìm thấy task cần sửa -> Trộn dữ liệu mới vào
          if (t.id === updatedTask.id) {
            return { ...t, ...updatedTask };
          }
          return t;
        }),
      }))
    );
  };

  const handleDeleteTaskInList = (taskId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        // Lọc bỏ task có id trùng khớp khỏi mọi cột
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );

    // Đóng modal và reset selection
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // Drag & Drop Placeholder
  // --- LOGIC KÉO THẢ TASK ---
  const handleMoveTask = async (
    taskId: string,
    targetColumnId: string,
    newIndex?: number
  ) => {
    // 1. Tìm cột nguồn và cột đích
    const sourceColumn = columns.find((col) =>
      col.tasks.some((t) => t.id === taskId)
    );
    const destColumn = columns.find((col) => col.id === targetColumnId);

    if (!sourceColumn || !destColumn) return;

    // Nếu thả vào đúng vị trí cũ thì không làm gì
    if (sourceColumn.id === destColumn.id && newIndex === undefined) return;

    // 2. Clone state hiện tại để sửa đổi
    const newColumns = [...columns];
    const sourceColIndex = newColumns.findIndex(
      (c) => c.id === sourceColumn.id
    );
    const destColIndex = newColumns.findIndex((c) => c.id === destColumn.id);

    // 3. Lấy task ra khỏi cột cũ
    const taskIndex = newColumns[sourceColIndex].tasks.findIndex(
      (t) => t.id === taskId
    );
    const [movedTask] = newColumns[sourceColIndex].tasks.splice(taskIndex, 1);

    // 4. Chèn task vào cột mới
    // Nếu newIndex không được cung cấp (thả vào vùng trống), mặc định xuống cuối
    const destinationIndex =
      newIndex !== undefined ? newIndex : newColumns[destColIndex].tasks.length;

    newColumns[destColIndex].tasks.splice(destinationIndex, 0, movedTask);

    // 5. Cập nhật State UI NGAY LẬP TỨC
    setColumns(newColumns);

    // 6. Gọi API cập nhật Backend (Gửi ngầm)
    try {
      await taskApi.move(taskId, {
        targetColumnId: targetColumnId,
        position: destinationIndex, // Backend cần biết vị trí mới
      });
      // Không cần toast thông báo mỗi lần kéo thả để tránh spam
    } catch (error) {
      console.error("Move task failed:", error);
      toast.error("Không thể lưu vị trí thẻ (F5 để đồng bộ lại)");
      // Nếu lỗi nghiêm trọng, có thể revert state ở đây (tùy chọn)
    }
  };

  // Invite
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await projectApi.addMember(projectId, inviteEmail);
      toast.success(`Đã mời ${inviteEmail}`);
      setInviteEmail("");
      setIsInviteOpen(false);
    } catch (error) {
      toast.error("Lỗi mời thành viên");
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  return (
    <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-bold text-slate-800">{projectTitle}</h2>
            <p
              className="text-sm text-slate-500 max-w-md truncate"
              title={projectDesc}
            >
              {projectDesc || "Chưa có mô tả"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />{" "}
              <span className="hidden sm:inline">Thành viên</span>
            </Button>

            {/* Nút Quản lý Nhãn Mới */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLabelMgrOpen(true)}
              className="text-slate-500"
              title="Quản lý nhãn"
            >
              <Tag className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-500"
              title="Cài đặt"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Board Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full flex px-4 pb-4 gap-6 pt-6">
            {/* Render Columns */}
            {columns.map((column, index) => (
              <BoardColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={column.tasks}
                onTaskClick={(t) => {
                  setSelectedTask(t);
                  setIsModalOpen(true);
                }}
                onAddTask={handleAddTask}
                onMoveTask={handleMoveTask}
                onRename={(newTitle) => handleRenameColumn(column.id, newTitle)}
                onDelete={() => handleDeleteColumn(column.id)}
              />
            ))}
        {/* Dialog Invite */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mời thành viên</DialogTitle>
              <DialogDescription>
                Nhập email để mời vào dự án.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail}
              >
                {isInviting ? <Loader2 className="animate-spin" /> : "Mời"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Settings Dialog */}
      <ProjectSettingsDialog
        projectId={projectId}
        currentTitle={projectTitle}
        currentDescription={projectDesc}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={(newName, newDescription) => {
          setProjectTitle(newName);
          setProjectDesc(newDescription);
          // Socket sẽ tự lo phần cập nhật cho người khác
        }}
        onDeleteSuccess={() => {
          setIsSettingsOpen(false);
          onBack(); // Quay về Dashboard
        }}
        />
      {/* Label Management Dialog */}
      <LabelManagementDialog
        projectId={projectId}
        isOpen={isLabelMgrOpen}
        onClose={() => setIsLabelMgrOpen(false)}
        />

        {/* Task Modal - Truyền selectedTask có chứa comments từ Board xuống */}
        {selectedTask && (
          <CardDetailModal
            task={selectedTask}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTask(null);
            }}
            // Cập nhật lại list ở BoardView sau khi sửa trong Modal
            onUpdate={handleUpdateTaskInList}
            onDelete={handleDeleteTaskInList}
          />
        )}
          </div>
      </div>
    </div>
    </DndProvider>
  );
}



