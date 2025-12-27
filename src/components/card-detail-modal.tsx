import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Trash2 } from "lucide-react";
// import { Task } from './task-card';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlignLeft,
  User,
  Tag,
  Calendar,
  CheckSquare,
  Paperclip,
  X,
  Plus,
  Send,
} from "lucide-react";
import { taskApi, Task, TaskAssignee, userApi } from "../lib/api"; // Import api
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

// Giả lập danh sách thành viên dự án (Thực tế nên fetch từ API getProjectDetail)
const MOCK_PROJECT_MEMBERS = [
  { id: "123e4567-e89b-12d3-a456-426614174000", name: "John Doe", avatar: "" },
  { id: "user-2", name: "Jane Smith", avatar: "" },
];

// Giả lập danh sách Label có sẵn
const MOCK_LABELS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    name: "Design",
    color: "bg-purple-500",
  },
  { id: "label-2", name: "Development", color: "bg-blue-500" },
];

interface CardDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete?: (taskId: string, columnId: string) => void; // Prop mới
}

export function CardDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: CardDetailModalProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [newComment, setNewComment] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [isRemovingChecklist, setIsRemovingChecklist] = useState<Set<string>>(new Set());
  const [lastAdded, setLastAdded] = useState<{ text: string; ts: number } | null>(null);
  // checklist items local state: items may have serverId (from API) or only tempId (new local items)
  const [checklistItems, setChecklistItems] = useState<Array<{ tempId: string; serverId?: string; text: string; completed: boolean }>>([]);
  // snapshot of original server-side checklist items to detect deletions/changes
  const [originalChecklistItems, setOriginalChecklistItems] = useState<Array<{ id: string; text: string; checked: boolean }>>([]);

  const [comments] = useState([
    {
      id: "1",
      author: "Jane Smith",
      avatar: "",
      text: "I have completed the initial research. The main competitors are using similar layouts.",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      author: "John Doe",
      avatar: "",
      text: "Great work! Let us schedule a review meeting for Friday.",
      timestamp: "1 hour ago",
    },
  ]);

  const [activities] = useState([
    {
      id: "1",
      user: "John Doe",
      action: 'moved this card from "To Do" to "In Progress"',
      timestamp: "3 hours ago",
    },
    {
      id: "2",
      user: "Jane Smith",
      action: "added a checklist",
      timestamp: "4 hours ago",
    },
    {
      id: "3",
      user: "John Doe",
      action: "created this card",
      timestamp: "1 day ago",
    },
  ]);

  React.useEffect(() => {
    setEditedTask(task);
    // Reset checklist items when task is cleared
    if (!task) {
      setChecklistItems([]);
      setOriginalChecklistItems([]);
      setNewChecklistItem("");
    }
  }, [task]);

  // When modal opens, fetch fresh task details from API to ensure we have full assignee info
  useEffect(() => {
    let mounted = true;
    const loadDetail = async () => {
      if (!task) return;
      try {
        const { data } = await taskApi.getDetail(task.id);
        if (!mounted) return;
        setEditedTask(data);
        
        // Load checklist items from API response
        const raw = (data as any).checklists || (data as any).checklistItems || [];
        if (Array.isArray(raw)) {
          // Remove duplicates by id and text before mapping
          const uniqueItems = raw.filter((c: any, index: number, self: any[]) => 
            index === self.findIndex((item: any) => 
              (item.id && c.id && item.id === c.id) || 
              (!item.id && !c.id && (item.text || item.name || '').trim().toLowerCase() === (c.text || c.name || '').trim().toLowerCase())
            )
          );
          
          // Use unique tempId based on serverId to avoid duplicates
          const mapped = uniqueItems.map((c: any, idx: number) => ({ 
            tempId: c.id ? `server_${c.id}` : `${Date.now()}_${idx}_${Math.random().toString(36).slice(2,9)}`, 
            serverId: c.id, 
            text: c.text || c.name || '', 
            completed: !!c.checked || !!c.completed 
          }));
          setChecklistItems(mapped);
          setOriginalChecklistItems(uniqueItems.map((c: any) => ({ 
            id: c.id, 
            text: c.text || c.name || '', 
            checked: !!c.checked || !!c.completed 
          })));
        } else {
          setChecklistItems([]);
          setOriginalChecklistItems([]);
        }
      } catch (err) {
        console.error('Failed to fetch task detail', err);
      }
    };

    loadDetail();
    return () => { mounted = false; };
  }, [task]);

  // Simple cache for resolved user names
  const userNameCache = new Map<string, string>();
  const [displayAssignees, setDisplayAssignees] = useState<TaskAssignee[]>([]);

  const extractIds = (arr: any[] | undefined) => (arr || []).map(a => (typeof a === 'string' ? a : a.id));

  // Resolve assignee names (support string[] or TaskAssignee[])
  useEffect(() => {
    let mounted = true;
    const raw = editedTask?.assignees || [];
    if (raw.length === 0) {
      setDisplayAssignees([]);
      return;
    }

    // If already objects, use them
    if (typeof raw[0] !== 'string') {
      setDisplayAssignees(raw as TaskAssignee[]);
      return;
    }

    const ids = raw as string[];
    const unresolved = ids.filter(id => !userNameCache.has(id));

    if (unresolved.length === 0) {
      setDisplayAssignees(ids.map(id => ({ id, name: userNameCache.get(id) || id.slice(0,8), avatar: '' })));
      return;
    }

    Promise.all(unresolved.map(id => userApi.get(id).then(r => { userNameCache.set(id, r.data.name || id.slice(0,8)); }).catch(() => { userNameCache.set(id, id.slice(0,8)); })))
      .then(() => {
        if (!mounted) return;
        setDisplayAssignees(ids.map(id => ({ id, name: userNameCache.get(id) || id.slice(0,8), avatar: '' })));
      });

    return () => { mounted = false; };
  }, [editedTask?.assignees]);

  // --- LOGIC ASSIGNEES ---
  // Helper: Lấy thông tin user từ ID
  const getMemberInfo = (userId: string) =>
    MOCK_PROJECT_MEMBERS.find((m) => m.id === userId) || {
      name: "Unknown",
      avatar: "",
    };

  const handleToggleAssignee = async (userId: string) => {
    if (!editedTask) return;
    const currentIds = extractIds(editedTask.assignees as any[]);
    const isAssigned = currentIds.includes(userId);

    try {
      let updatedTaskData;
      if (isAssigned) {
        const { data } = await taskApi.removeAssignee(editedTask.id, userId);
        updatedTaskData = data;
        toast.success("Đã xóa thành viên");
      } else {
        const { data } = await taskApi.addAssignee(editedTask.id, userId);
        updatedTaskData = data;
        toast.success("Đã thêm thành viên");
      }

      setEditedTask(updatedTaskData);
      onUpdate(updatedTaskData);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi cập nhật thành viên");
    }
  };

  // --- LOGIC LABELS ---
  // Helper: Lấy thông tin label từ ID
  const getLabelInfo = (labelId: string) =>
    MOCK_LABELS.find((l) => l.id === labelId) || {
      name: "Unknown",
      color: "bg-gray-500",
    };

  const handleAddLabel = async (labelId: string) => {
    if (editedTask.labels.includes(labelId)) return; // Đã có label này

    try {
      const { data } = await taskApi.addLabel(editedTask.id, labelId);
      setEditedTask(data);
      onUpdate(data);
      toast.success("Đã thêm nhãn");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi thêm nhãn");
    }
  };

  const handleSave = () => {
    // Save via API: sync checklist items then update task
    const save = async () => {
      if (!editedTask) return;
      try {
        // Determine items to create/update/delete
        const toCreate = checklistItems.filter(ci => !ci.serverId);
        const toKeep = checklistItems.filter(ci => !!ci.serverId);
        const currentServerIds = toKeep.map(ci => ci.serverId!);
        const toDelete = originalChecklistItems.filter(orig => !currentServerIds.includes(orig.id));

        // Create - avoid duplicates by checking text
        const createdTexts = new Set<string>();
        for (const ci of toCreate) {
          // Skip if text already exists (case-insensitive)
          const textLower = ci.text.trim().toLowerCase();
          if (createdTexts.has(textLower)) {
            console.warn('Skipping duplicate checklist item:', ci.text);
            continue;
          }
          createdTexts.add(textLower);
          
          try {
            await taskApi.addChecklistItem(editedTask.id, { text: ci.text, checked: ci.completed });
          } catch (e) {
            console.warn('create checklist item failed', e);
          }
        }

        // Update
        for (const ci of toKeep) {
          const orig = originalChecklistItems.find(o => o.id === ci.serverId);
          if (!orig) continue;
          if (orig.text !== ci.text || !!orig.checked !== !!ci.completed) {
            try {
              await taskApi.updateChecklistItem(editedTask.id, ci.serverId!, { text: ci.text, checked: ci.completed });
            } catch (e) {
              console.warn('update checklist item failed', e);
            }
          }
        }

        // Delete - only delete items that are in originalChecklistItems but not in current checklistItems
        // Note: Items that were already deleted via removeChecklistItem are already removed from originalChecklistItems
        // API uses item_text (text) as identifier, not ID
        for (const d of toDelete) {
          try {
            console.log('Deleting checklist item during save:', { id: d.id, text: d.text });
            await taskApi.deleteChecklistItem(editedTask.id, d.text);
          } catch (e: any) {
            // If item was already deleted (404), that's okay
            if (e?.response?.status === 404) {
              console.log('Item already deleted, skipping:', d.text);
            } else {
              console.warn('delete checklist item failed', e);
            }
          }
        }

        // Update main task fields
        const payload: any = {
          title: editedTask.title,
          description: editedTask.description,
          dueDate: editedTask.dueDate,
          assignees: extractIds(editedTask.assignees as any[]),
          labels: extractIds(editedTask.labels as any[]),
        };
        const { data } = await taskApi.update(editedTask.id, payload);

        // Refresh details
        try {
          const { data: refreshed } = await taskApi.getDetail(editedTask.id);
          setEditedTask(refreshed);
          const raw = (refreshed as any).checklists || (refreshed as any).checklistItems || [];
          if (Array.isArray(raw)) {
            // Remove duplicates by id and text before mapping
            const uniqueItems = raw.filter((c: any, index: number, self: any[]) => 
              index === self.findIndex((item: any) => 
                (item.id && c.id && item.id === c.id) || 
                (!item.id && !c.id && (item.text || item.name || '').trim().toLowerCase() === (c.text || c.name || '').trim().toLowerCase())
              )
            );
            
            // Use unique tempId based on serverId to avoid duplicates
            const mapped = uniqueItems.map((c: any, idx: number) => ({ 
              tempId: c.id ? `server_${c.id}` : `${Date.now()}_${idx}_${Math.random().toString(36).slice(2,9)}`, 
              serverId: c.id, 
              text: c.text || c.name || '', 
              completed: !!c.checked || !!c.completed 
            }));
            setChecklistItems(mapped);
            setOriginalChecklistItems(uniqueItems.map((c: any) => ({ 
              id: c.id, 
              text: c.text || c.name || '', 
              checked: !!c.checked || !!c.completed 
            })));
          }
        } catch (e) {
          console.warn('refresh detail failed', e);
        }

        onUpdate(data);
        toast.success('Đã lưu thay đổi');
        onClose();
      } catch (err) {
        console.error('Failed to save task', err);
        toast.error('Lưu thất bại');
      }
    };

    save();
  };

  if (!editedTask) return null;

  const completedItems = checklistItems.filter((item) => item.completed).length;
  const totalItems = checklistItems.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const availableLabels = [
    { name: "Design", color: "bg-purple-500" },
    { name: "Development", color: "bg-blue-500" },
    { name: "Bug", color: "bg-red-500" },
    { name: "Feature", color: "bg-green-500" },
    { name: "Urgent", color: "bg-orange-500" },
  ];

  const teamMembers = [
    // Use MOCK_PROJECT_MEMBERS (has ids) so we can call API endpoints
    ...MOCK_PROJECT_MEMBERS,
  ];

  const toggleChecklistItem = (tempId: string) => {
    setChecklistItems(prev => prev.map(item => item.tempId === tempId ? { ...item, completed: !item.completed } : item));
  };

  const addChecklistItem = () => {
    const text = newChecklistItem.trim();
    if (!text) return;
    
    // Check if item already exists (case-insensitive)
    const exists = checklistItems.some(item => 
      item.text.trim().toLowerCase() === text.toLowerCase()
    );
    if (exists) {
      toast.error('Mục này đã tồn tại trong checklist');
      return;
    }
    
    // Prevent rapid duplicate additions
    const now = Date.now();
    if (lastAdded && lastAdded.text.toLowerCase() === text.toLowerCase() && now - lastAdded.ts < 1000) {
      return;
    }
    
    // Prevent double-click
    if (isAddingChecklist) return;
    
    setIsAddingChecklist(true);
    const tempId = `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    setChecklistItems(prev => [...prev, { tempId, text, completed: false } as any]);
    setLastAdded({ text, ts: now });
    setNewChecklistItem("");
    setTimeout(() => setIsAddingChecklist(false), 500);
  };

  const removeChecklistItem = async (tempId: string) => {
    // Prevent double-click removal
    if (isRemovingChecklist.has(tempId)) {
      console.log('Item is already being removed:', tempId);
      return;
    }
    
    if (!editedTask) {
      console.error('No task selected');
      return;
    }
    
    const item = checklistItems.find(c => c.tempId === tempId);
    if (!item) {
      console.warn('Item not found:', tempId, 'Available items:', checklistItems.map(i => i.tempId));
      return;
    }
    
    console.log('Removing checklist item:', { tempId, serverId: item.serverId, text: item.text });
    setIsRemovingChecklist(prev => new Set(prev).add(tempId));
    
    // Optimistic update: remove from UI immediately
    const previousItems = [...checklistItems];
    
    // Only remove from checklistItems, NOT from originalChecklistItems
    // This allows the save logic to detect deleted items
    setChecklistItems(prev => prev.filter(c => c.tempId !== tempId));
    
    try {
      if (item.serverId) {
        // Item exists on server, delete via API immediately using item text
        console.log('Deleting from server:', { taskId: editedTask.id, itemText: item.text });
        const response = await taskApi.deleteChecklistItem(editedTask.id, item.text);
        console.log('Delete response:', response);
        
        // Only remove from originalChecklistItems after successful API call
        setOriginalChecklistItems(prev => prev.filter(o => o.id !== item.serverId));
        
        // Refresh task to get updated checklist count
        try {
          const { data: refreshed } = await taskApi.getDetail(editedTask.id);
          setEditedTask(refreshed);
          onUpdate(refreshed);
        } catch (refreshError) {
          console.warn('Failed to refresh task after delete', refreshError);
        }
        
        toast.success('Đã xóa mục checklist');
      } else {
        // Item is local only, already removed from state
        console.log('Removing local item only');
        toast.success('Đã xóa mục checklist');
      }
    } catch (e: any) {
      // Rollback on error
      console.error('Failed to delete checklist item', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Xóa mục thất bại';
      console.error('Error details:', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: errorMessage
      });
      // Rollback checklistItems
      setChecklistItems(previousItems);
      toast.error(`Xóa mục thất bại: ${errorMessage}`);
    } finally {
      // Remove from removing set after a delay
      setTimeout(() => {
        setIsRemovingChecklist(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
      }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start gap-3">
              <AlignLeft className="w-6 h-6 text-slate-600 mt-1" />
              <div className="flex-1">
                <DialogTitle className="text-slate-900 mb-2">
                  <input
                    type="text"
                    value={editedTask.title}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, title: e.target.value })
                    }
                    className="w-full bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                  />
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  in list To Do
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Labels */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-slate-600" />
                    <h3 className="text-slate-900">Labels</h3>
                  </div>
                  {/* Labels Section */}
                  <div className="flex flex-wrap gap-2">
                    {editedTask.labels.map((labelId, index) => {
                      // Sửa label -> labelId
                      const labelInfo = getLabelInfo(labelId); // Lấy thông tin từ ID
                      return (
                        <Badge
                          key={index}
                          className={`${labelInfo.color} text-white border-0`}
                        >
                          {labelInfo.name}
                          {/* Tạm thời bỏ nút xóa label ở đây vì chưa có API xóa label cụ thể trong context này */}
                        </Badge>
                      );
                    })}
                    {/* Nút Add Label (+ Popover) */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-1" /> Add label
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="space-y-2">
                          {MOCK_LABELS.map(
                            (
                              label,
                              index // Dùng MOCK_LABELS thay vì availableLabels cũ
                            ) => (
                              <button
                                key={index}
                                onClick={() => handleAddLabel(label.id)} // <--- GỌI HÀM API MỚI
                                className={`w-full px-3 py-2 rounded text-white ${label.color} hover:opacity-90 text-left`}
                              >
                                {label.name}
                              </button>
                            )
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlignLeft className="w-5 h-5 text-slate-600" />
                    <h3 className="text-slate-900">Description</h3>
                  </div>
                  <Textarea
                    placeholder="Add a more detailed description..."
                    value={editedTask.description || ""}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        description: e.target.value,
                      })
                    }
                    className="min-h-[100px]"
                  />
                </div>

                {/* Checklist */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-5 h-5 text-slate-600" />
                    <h3 className="text-slate-900">Checklist</h3>
                    <span className="text-slate-500">
                      {completedItems}/{totalItems}
                    </span>
                  </div>
                  <Progress value={progress} className="mb-4" />
                  <div className="space-y-2 mb-3">
                    {checklistItems.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">Chưa có mục nào trong checklist</p>
                    ) : (
                      checklistItems.map((item) => (
                        <div
                          key={item.tempId}
                          className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 group"
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem(item.tempId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span
                            className={`flex-1 cursor-default ${
                              item.completed
                                ? "line-through text-slate-500"
                                : "text-slate-700"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.text}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeChecklistItem(item.tempId);
                            }}
                            disabled={isRemovingChecklist.has(item.tempId)}
                            className="text-slate-400 hover:text-red-600 ml-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 rounded hover:bg-red-50"
                            aria-label="Remove checklist item"
                            title="Xóa mục này"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addChecklistItem();
                        }
                      }}
                    />
                    <Button
                      onClick={addChecklistItem}
                      disabled={isAddingChecklist}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingChecklist ? 'Đang thêm...' : 'Add'}
                    </Button>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-5 h-5 text-slate-600" />
                    <h3 className="text-slate-900">Attachments</h3>
                  </div>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add attachment
                  </Button>
                </div>

                {/* Activity & Comments */}
                <div>
                  <Tabs defaultValue="comments" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>
                    <TabsContent value="comments" className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback className="bg-blue-600 text-white">
                              {comment.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-slate-900">
                                {comment.author}
                              </span>
                              <span className="text-slate-500">
                                {comment.timestamp}
                              </span>
                            </div>
                            <p className="text-slate-700 bg-slate-50 rounded-lg p-3">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-600 text-white">
                            JD
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <Button
                            size="icon"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="activity" className="space-y-3">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            {activity.user
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-700">
                              <span className="text-slate-900">
                                {activity.user}
                              </span>{" "}
                              {activity.action}
                            </p>
                            <p className="text-slate-500">
                              {activity.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-slate-900 mb-3">Add to card</h4>
                  <div className="space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Members
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="space-y-2">
                          {teamMembers.map((member, index) => (
                            <button
                              key={index}
                              className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-100"
                              onClick={() => {
                                // Toggle via API if id present
                                if ((member as any).id) {
                                  handleToggleAssignee((member as any).id);
                                } else if (
                                  !editedTask.assignees.find(
                                    (a: any) => (typeof a === 'string' ? a === (member as any).id : a.name === member.name)
                                  )
                                ) {
                                  setEditedTask({
                                    ...editedTask,
                                    assignees: [
                                      ...editedTask.assignees,
                                      member,
                                    ],
                                  });
                                }
                              }}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="bg-slate-200 text-slate-700">
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-slate-900">
                                {member.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Due date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={
                            editedTask.dueDate
                              ? new Date(editedTask.dueDate)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              setEditedTask({
                                ...editedTask,
                                dueDate: date.toISOString(),
                              });
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button variant="outline" className="w-full justify-start">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attachment
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-slate-900 mb-3">Assigned to</h4>
                  <div className="space-y-2">
                    {displayAssignees.map((assignee, index) => (
                      <div
                        key={assignee.id || index}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={assignee.avatar} />
                            <AvatarFallback className="bg-slate-200 text-slate-700">
                              {(assignee.name || assignee.id || "")
                                .toString()
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-slate-900">
                            {assignee.name || assignee.id}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            // Call API to remove
                            if (assignee.id) {
                              handleToggleAssignee(assignee.id);
                            } else {
                              // fallback: remove locally
                              setEditedTask({
                                ...editedTask,
                                assignees: (editedTask.assignees || []).filter((a: any, i: number) => i !== index),
                              });
                            }
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thêm nút Delete vào Footer hoặc góc Header */}
          <div className="p-6 pt-4 border-t border-slate-200 flex justify-between gap-2">
            {/* Nút Xóa (Mới) */}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(editedTask.id, editedTask.columnId)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa thẻ
              </Button>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
