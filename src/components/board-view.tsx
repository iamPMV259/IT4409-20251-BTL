import React, { useState, useEffect } from "react";
import {
  Plus,
  ArrowLeft,
  Loader2,
  UserPlus,
  Settings,
  Tag,
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
import { LabelManagementDialog } from "./label-management-dialog"; // Đừng quên import cái này
import { projectApi, taskApi, columnApi } from "../lib/api";
import { toast } from "sonner";
import { useSocket } from "../context/socket-context";
import { useProjectBoard } from "../hooks/useProjectBoard";
import { useQueryClient } from "@tanstack/react-query";
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
  projectDesc?: string; // Optional vì có thể không truyền từ ngoài vào
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
  // Use React Query hook
  const { board, isLoading, moveTask, isMovingTask } = useProjectBoard(projectId);
  const queryClient = useQueryClient();

  // Local state từ board data
  const [columns, setColumns] = useState<UIColumn[]>([]);
  const [projectTitle, setProjectTitle] = useState(initialTitle);
  const [projectDesc, setProjectDesc] = useState(initialDescription || "");

  // UI States
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dialog States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLabelMgrOpen, setIsLabelMgrOpen] = useState(false); // State cho Label Dialog

  // Socket
  const { connectToProject, disconnect, lastJsonMessage } = useSocket();

  useEffect(() => {
    if (projectId) connectToProject(projectId);
    return () => disconnect();
  }, [projectId, connectToProject, disconnect]);

  // SOCKET HANDLER
  useEffect(() => {
    if (lastJsonMessage !== null) {
      const { event, data } = lastJsonMessage;
      // console.log("🔔 Socket Event:", event, data);

      switch (event) {
        case "server:project_updated":
          console.log("Socket Update Project:", data); // Debug xem data có gì

          // Cập nhật tên nếu có
          if (data.name) setProjectTitle(data.name);

          // Cập nhật mô tả (QUAN TRỌNG: Kiểm tra !== undefined để cho phép set rỗng)
          if (data.description !== undefined) {
            setProjectDesc(data.description);
          }

          toast.info(`Thông tin dự án đã được cập nhật`);
          break;

        // Cập nhật Description realtime
        case "server:project_description_updated":
          setProjectDesc(data.description);
          break;

        case "server:column_created":
          setColumns((prev) =>
            prev.some((c) => c.id === data.columnId)
              ? prev
              : [...prev, { id: data.columnId, title: data.title, tasks: [] }]
          );
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

        case "server:task_created":
          // Socket tự động thêm task, không cần làm gì vì logic handleAddTask đã bỏ setColumns
          setColumns((prev) =>
            prev.map((col) => {
              if (col.id === data.columnId) {
                if (col.tasks.some((t) => t.id === data.id)) return col;
                const newTask = {
                  id: data.id,
                  columnId: data.columnId, // Đảm bảo có columnId
                  title: data.title,
                  description: data.description || "",
                  dueDate: data.dueDate,
                  assignees: data.assignees || [],
                  labels: data.labels || [],
                  checklists: [],
                  comments: 0,
                  priority: "medium",
                  attachments: 0,
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
              tasks: col.tasks.map((t) =>
                t.id === data.id ? { ...t, ...data } : t
              ),
            }))
          );
          break;

        case "server:task_moved":
          handleServerTaskMove(data);
          break;

        case "server:task_deleted":
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t.id !== data.taskId),
            }))
          );
          break;
      }
    }
  }, [lastJsonMessage]);

  const handleServerTaskMove = (data: any) => {
    const { taskId, sourceColumnId, destColumnId, newPosition } = data;
    setColumns((prev) => {
      const newCols = [...prev];
      const sInd = newCols.findIndex((c) => c.id === sourceColumnId);
      const dInd = newCols.findIndex((c) => c.id === destColumnId);
      if (sInd === -1 || dInd === -1) return prev;

      const sCol = { ...newCols[sInd], tasks: [...newCols[sInd].tasks] };
      const dCol = { ...newCols[dInd], tasks: [...newCols[dInd].tasks] };

      const tInd = sCol.tasks.findIndex((t) => t.id === taskId);
      if (tInd === -1) return prev;

      const [task] = sCol.tasks.splice(tInd, 1);
      // Cập nhật columnId mới cho task
      task.columnId = destColumnId;

      if (sourceColumnId === destColumnId) {
        sCol.tasks.splice(newPosition, 0, task);
        newCols[sInd] = sCol;
      } else {
        dCol.tasks.splice(newPosition, 0, task);
        newCols[sInd] = sCol;
        newCols[dInd] = dCol;
      }
      return newCols;
    });
  };

  // Sync board data từ React Query vào local state
  useEffect(() => {
    if (board) {
      setProjectTitle(board.project.name);
      
      const formattedColumns: UIColumn[] = board.columns.map((col) => ({
        id: col.id,
        title: col.title,
        tasks: (col.tasks || []).map((t: any) => ({
          id: t.id || t._id || t.taskId,
          columnId: col.id,
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

      const order = board.project.column_order || [];
      if (order.length > 0) {
        formattedColumns.sort(
          (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
        );
      }
      setColumns(formattedColumns);
    }
  }, [board]);

  // Fetch description riêng (optional - nếu cần)
  useEffect(() => {
    const fetchDescription = async () => {
      try {
        const { data } = await projectApi.getDetail(projectId);
        if (data.data?.description !== undefined) {
          setProjectDesc(data.data.description);
        }
      } catch (e) {
        // Không có quyền hoặc lỗi - bỏ qua
      }
    };
    if (projectId) fetchDescription();
  }, [projectId]);

  // --- ACTIONS ---
  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    try {
      const { data } = await columnApi.create(projectId, newColumnTitle);
      toast.success("Đã tạo cột mới");
      // UI update (fallback nếu socket chậm)
      const newCol = data.data
        ? { id: data.data.id, title: data.data.title, tasks: [] }
        : null;
      if (newCol) setColumns((prev) => [...prev, newCol]);

      setNewColumnTitle("");
      setIsAddingColumn(false);
    } catch (error) {
      toast.error("Lỗi tạo cột");
    }
  };

  const handleRenameColumn = async (columnId: string, newTitle: string) => {
    try {
      await columnApi.update(columnId, newTitle);
      // Không cần setColumns thủ công nếu tin tưởng Socket, nhưng giữ để phản hồi nhanh
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

  // Task Actions
  const handleAddTask = async (columnId: string, title: string) => {
    try {
      // Chỉ gọi API, đợi socket server:task_created cập nhật UI để tránh duplicate
      await taskApi.create(columnId, { title });
      toast.success("Đã tạo thẻ");
    } catch (error) {
      toast.error("Lỗi tạo thẻ");
    }
  };

  // Optimized Drag Drop với React Query
  const handleMoveTask = async (
    taskId: string,
    targetColumnId: string,
    newIndex?: number
  ) => {
    console.log('🎯 [BoardView] handleMoveTask called:', { taskId, targetColumnId, newIndex });
    const sourceColumn = columns.find((col) =>
      col.tasks.some((t) => t.id === taskId)
    );
    const destColumn = columns.find((col) => col.id === targetColumnId);
    if (!sourceColumn || !destColumn) {
      console.warn('⚠️ [BoardView] Source or dest column not found');
      return;
    }
    if (sourceColumn.id === destColumn.id && newIndex === undefined) {
      console.log('ℹ️ [BoardView] Same column, no position change');
      return;
    }

    // Optimistic update local state ngay lập tức
    const newColumns = [...columns];
    const sInd = newColumns.findIndex((c) => c.id === sourceColumn.id);
    const dInd = newColumns.findIndex((c) => c.id === destColumn.id);

    const taskIndex = newColumns[sInd].tasks.findIndex((t) => t.id === taskId);
    const [movedTask] = newColumns[sInd].tasks.splice(taskIndex, 1);
    movedTask.columnId = targetColumnId;

    const destIndex =
      newIndex !== undefined ? newIndex : newColumns[dInd].tasks.length;
    newColumns[dInd].tasks.splice(destIndex, 0, movedTask);

    setColumns(newColumns);

    try {
      // Sử dụng React Query mutation
      moveTask(
        { taskId, targetColumnId, position: destIndex },
        {
          onError: () => {
            toast.error("Lỗi lưu vị trí");
            // Rollback bằng cách refetch
            queryClient.invalidateQueries({ queryKey: ['project-board', projectId] });
          },
        }
      );
    } catch (error) {
      toast.error("Lỗi lưu vị trí");
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
      toast.error("Email không hợp lệ hoặc đã mời trước đó");
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
        {/* HEADER */}
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
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {projectTitle}
              </h2>
              {/* --- HIỂN THỊ DESCRIPTION CHÍNH XÁC --- */}
              <p
                className="text-sm text-slate-500 max-w-md truncate"
                title={projectDesc}
              >
                {projectDesc || "Chưa có mô tả"}
              </p>
            </div>
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

            {/* Nút Quản lý Nhãn */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLabelMgrOpen(true)}
              className="text-slate-500"
              title="Quản lý nhãn"
            >
              <Tag className="w-5 h-5" />
            </Button>

            {/* Nút Cài đặt */}
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

        {/* BOARD CONTENT */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full flex px-4 pb-4 gap-6 pt-6">
            {columns.map((column) => (
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

            <div className="flex-shrink-0 w-80">
              {isAddingColumn ? (
                <div className="bg-white rounded-xl p-3 shadow-md border border-slate-200">
                  <Input
                    placeholder="Tiêu đề cột..."
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                    autoFocus
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddColumn}
                      className="bg-blue-600 hover:bg-blue-700 h-8"
                    >
                      Thêm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingColumn(false)}
                      className="h-8"
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 bg-white/40 border-2 border-dashed border-slate-300 text-slate-600"
                  onClick={() => setIsAddingColumn(true)}
                >
                  <Plus className="w-5 h-5 mr-2" /> Thêm cột mới
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* DIALOGS */}
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

        {/* Settings Dialog - Đã sửa lỗi update description */}
        <ProjectSettingsDialog
          projectId={projectId}
          currentTitle={projectTitle}
          currentDescription={projectDesc}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdate={(newName, newDescription) => {
            setProjectTitle(newName);
            setProjectDesc(newDescription);
          }}
          onDeleteSuccess={() => {
            setIsSettingsOpen(false);
            onBack();
          }}
        />

        {/* Label Management Dialog - Tính năng mới */}
        <LabelManagementDialog
          projectId={projectId}
          isOpen={isLabelMgrOpen}
          onClose={() => setIsLabelMgrOpen(false)}
        />

        {/* Task Modal - Đã sửa logic xóa */}
        {selectedTask && (
          <CardDetailModal
            task={selectedTask}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTask(null);
            }}
            onUpdate={(updatedTask) => {
              setColumns((prev) =>
                prev.map((col) => ({
                  ...col,
                  tasks: col.tasks.map((t) =>
                    t.id === updatedTask.id ? { ...t, ...updatedTask } : t
                  ),
                }))
              );
            }}
            onDelete={(taskId) => {
              setColumns((prev) =>
                prev.map((col) => ({
                  ...col,
                  tasks: col.tasks.filter((t) => t.id !== taskId),
                }))
              );
              setIsModalOpen(false);
              setSelectedTask(null);
              toast.success("Đã xóa thẻ");
            }}
          />
        )}
      </div>
    </DndProvider>
  );
}
