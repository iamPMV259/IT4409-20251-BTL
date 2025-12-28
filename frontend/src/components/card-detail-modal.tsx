import React, { useState, useEffect, useMemo } from "react";
import {
  X, AlignLeft, CheckSquare, Clock, Trash2, Save, Loader2,
  Tag, User, Plus, Send, MessageSquare, CheckCircle2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { 
  projectApi,
  taskApi,
  Comment, Label 
} from "../lib/api";
import { useTaskDetail } from "../hooks/useTaskDetail";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

interface CardDetailModalProps {
  task: any | null; // Chỉ cần ID từ đây là đủ
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: any) => void;
  onDelete: (taskId: string, columnId: string) => void;
}

export function CardDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: CardDetailModalProps) {
  
  const queryClient = useQueryClient();
  
  // Use React Query hook
  const {
    task: fullTaskData,
    isLoading,
    updateTask,
    isUpdating,
    addComment,
    isAddingComment,
    addChecklistItem,
    updateChecklistItem,
    addAssignee,
    removeAssignee,
    addLabel,
    deleteTask,
    isDeletingTask,
  } = useTaskDetail(task?.id || task?._id || null);
  
  // Flag để ngăn useEffect reset temp states khi React Query refetch
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Local edit states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // Temporary states for assignees and labels (chỉ cập nhật khi ấn Lưu)
  const [tempAssignees, setTempAssignees] = useState<string[]>([]);
  const [tempLabels, setTempLabels] = useState<string[]>([]);
  
  // Lưu giá trị ban đầu để reset khi đóng không lưu
  const [initialAssignees, setInitialAssignees] = useState<string[]>([]);
  const [initialLabels, setInitialLabels] = useState<string[]>([]);
  
  // Context Data
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  
  // UI States
  const [newComment, setNewComment] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Dropdowns
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [showLabelSelect, setShowLabelSelect] = useState(false);

  // Sync fullTaskData to local form - CHỈ MỘT LẦN khi mới mở modal
  useEffect(() => {
    if (fullTaskData && !hasInitialized) {
      setTitle(fullTaskData.title);
      setDescription(fullTaskData.description || "");
      setDueDate(fullTaskData.dueDate ? fullTaskData.dueDate.split('T')[0] : "");
      
      const assignees = fullTaskData.assignees || [];
      const labels = fullTaskData.labels || [];
      
      setTempAssignees(assignees);
      setTempLabels(labels);
      setInitialAssignees(assignees);
      setInitialLabels(labels);
      
      setHasInitialized(true);
    }
  }, [fullTaskData, hasInitialized]);

  // Load project context data (labels & members)
  useEffect(() => {
    if (!fullTaskData?.projectId) return;
    
    const fetchProjectContext = async () => {
      try {
        const [labelsRes, projectRes] = await Promise.all([
          projectApi.getLabels(fullTaskData.projectId).catch(() => ({ data: [] })),
          projectApi.getDetail(fullTaskData.projectId).catch(() => ({ data: { data: { members: [] } } })),
        ]);
        setProjectLabels(labelsRes.data || []);
        setProjectMembers(projectRes.data?.data?.members || []);
      } catch (e) {
        console.warn("Error loading project context:", e);
      }
    };
    
    fetchProjectContext();
  }, [fullTaskData?.projectId]);

  // --- HANDLERS với React Query ---

  const handleSave = async () => {
    if (!fullTaskData) return;
    
    setIsSaving(true);
    
    try {
      // 1. Cập nhật title, description, dueDate
      await updateTask(
        { title, description, dueDate: dueDate || undefined },
        { onError: () => toast.error("Lỗi lưu thông tin task") }
      );
      
      // 2. Xử lý Assignees - so sánh tempAssignees với dữ liệu hiện tại từ server
      const currentAssignees = fullTaskData.assignees || [];
      const toAddAssignees = tempAssignees.filter(id => !currentAssignees.includes(id));
      const toRemoveAssignees = currentAssignees.filter(id => !tempAssignees.includes(id));
      
      // Thêm assignees mới
      for (const userId of toAddAssignees) {
        try {
          await taskApi.addAssignee(fullTaskData.id, userId);
        } catch (error) {
          console.error(`Lỗi thêm thành viên ${userId}:`, error);
          toast.error(`Lỗi thêm thành viên`);
        }
      }
      
      // Xóa assignees cũ
      for (const userId of toRemoveAssignees) {
        try {
          await taskApi.removeAssignee(fullTaskData.id, userId);
        } catch (error) {
          console.error(`Lỗi xóa thành viên ${userId}:`, error);
          toast.error(`Lỗi xóa thành viên`);
        }
      }
      
      // 3. Xử lý Labels - so sánh tempLabels với dữ liệu hiện tại từ server
      const currentLabels = fullTaskData.labels || [];
      const toAddLabels = tempLabels.filter(id => !currentLabels.includes(id));
      const toRemoveLabels = currentLabels.filter(id => !tempLabels.includes(id));
      
      // Thêm labels mới
      for (const labelId of toAddLabels) {
        try {
          await taskApi.addLabel(fullTaskData.id, labelId);
        } catch (error) {
          console.error(`Lỗi thêm label ${labelId}:`, error);
          toast.error(`Lỗi thêm nhãn`);
        }
      }
      
      // Xóa labels cũ (sử dụng DELETE với body là array)
      if (toRemoveLabels.length > 0) {
        try {
          await taskApi.removeLabels(fullTaskData.id, toRemoveLabels);
        } catch (error) {
          console.error(`Lỗi xóa labels:`, error);
          toast.error(`Lỗi xóa nhãn`);
        }
      }
      
      toast.success("Đã lưu tất cả thay đổi");
      
      // Cập nhật initial values sau khi lưu thành công
      setInitialAssignees(tempAssignees);
      setInitialLabels(tempLabels);
      
      // Invalidate React Query cache để refetch data mới
      await queryClient.invalidateQueries({ queryKey: ['task', fullTaskData.id] });
      await queryClient.invalidateQueries({ queryKey: ['project-board', fullTaskData.projectId] });
      await queryClient.invalidateQueries({ queryKey: ['my-tasks'] }); // Refetch My Tasks view
      
      // Đợi refetch hoàn tất trước khi đóng modal (tăng lên 500ms để đảm bảo)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // KHÔNG gọi onUpdate với data ID - để board tự refetch với full objects
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Có lỗi xảy ra khi lưu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment, {
      onSuccess: () => {
        setNewComment("");
        toast.success("Đã thêm bình luận");
      },
      onError: () => {
        toast.error("Lỗi gửi bình luận");
      },
    });
  };

  const handleAddChecklist = () => {
    if (!newChecklistText.trim()) return;
    addChecklistItem(
      { text: newChecklistText, checked: false },
      {
        onSuccess: () => {
          setNewChecklistText("");
        },
        onError: () => {
          toast.error("Lỗi thêm checklist");
        },
      }
    );
  };

  const handleToggleChecklist = (index: number, item: any) => {
    updateChecklistItem(
      { index, checked: !item.checked },
      {
        onError: () => {
          toast.error("Lỗi cập nhật checklist");
        },
      }
    );
  };

  const handleToggleAssignee = (userId: string) => {
    setTempAssignees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleLabel = (labelId: string) => {
    setTempLabels(prev => 
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  };

  const handleDelete = () => {
    if (!fullTaskData || !window.confirm("Xóa công việc này?")) return;
    deleteTask(undefined, {
      onSuccess: () => {
        toast.success("Đã xóa công việc");
        onDelete(fullTaskData.id, fullTaskData.columnId);
        onClose();
      },
      onError: () => {
        toast.error("Lỗi xóa công việc");
      },
    });
  };

  // Reset về giá trị ban đầu khi đóng mà không lưu
  const handleClose = () => {
    setTempAssignees(initialAssignees);
    setTempLabels(initialLabels);
    setShowMemberSelect(false);
    setShowLabelSelect(false);
    setHasInitialized(false); // Reset flag để lần sau mở lại sync được
    onClose();
  };

  // Memoize computed values
  const checklist = useMemo(() => fullTaskData?.checklists || [], [fullTaskData]);
  const comments = useMemo(() => fullTaskData?.comments || [], [fullTaskData]);
  // Tính toán checklist progress
  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter(c => c.checked).length;
  const progressPercent = checklistTotal === 0 ? 0 : Math.round((checklistDone / checklistTotal) * 100);

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white">
        <DialogHeader className="absolute opacity-0 pointer-events-none h-0 overflow-hidden">
          <DialogTitle>{title || "Chi tiết công việc"}</DialogTitle>
          <DialogDescription>Xem và chỉnh sửa thông tin chi tiết công việc</DialogDescription>
        </DialogHeader>

        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative">
           <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-white/20" onClick={handleClose}>
             <X className="w-5 h-5"/>
           </Button>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="flex-1 space-y-6">
            <div className="flex gap-3">
              <CheckSquare className="w-6 h-6 text-blue-600 mt-2 shrink-0" />
              <div className="w-full">
                <Input 
                   value={title} onChange={e => setTitle(e.target.value)}
                   className="text-xl font-bold border-transparent hover:border-slate-200 focus:border-blue-500 px-2 -ml-2 rounded"
                />
                
                {/* Labels & Assignees Badges */}
                <div className="flex flex-wrap gap-2 mt-2 ml-2">
                   {/* Map Labels ID -> Object */}
                   {tempLabels.map((lId, idx) => {
                      const labelObj = projectLabels.find(l => l.id === lId);
                      return (
                        <Badge 
                          key={lId || idx} 
                          style={{backgroundColor: labelObj?.color || '#10b981'}} 
                          className="text-white hover:brightness-90 px-2 py-1 cursor-pointer flex items-center gap-1"
                          onClick={() => handleToggleLabel(lId)}
                        >
                          {labelObj?.text || "Label"}
                          <X className="w-3 h-3 hover:bg-white/20 rounded" />
                        </Badge>
                      );
                   })}
                   
                   {/* Map Assignees ID -> Object */}
                   {tempAssignees.map((uId, idx) => {
                      const member = projectMembers.find(m => m.user?.id === uId || m.user_id === uId);
                      const name = member?.user?.name || member?.name || "User";
                      return (
                         <div key={uId || idx} className="h-6 px-2 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1 text-xs font-medium cursor-pointer hover:bg-blue-100" onClick={() => handleToggleAssignee(uId)}>
                            <User className="w-3 h-3"/> {name}
                            <X className="w-3 h-3 hover:bg-blue-200 rounded" />
                         </div>
                      );
                   })}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <AlignLeft className="w-5 h-5 text-slate-500 mt-1" />
              <div className="w-full space-y-2">
                <h3 className="font-semibold text-slate-700">Mô tả</h3>
                <Textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="min-h-[100px] bg-slate-50" placeholder="Thêm mô tả..."
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="flex gap-3">
               <CheckCircle2 className="w-5 h-5 text-slate-500 mt-1" />
               <div className="w-full space-y-3">
                  <div className="flex justify-between items-center">
                     <h3 className="font-semibold text-slate-700">Việc cần làm</h3>
                     {checklistTotal > 0 && <span className="text-xs text-slate-500">{checklistDone}/{checklistTotal}</span>}
                  </div>
                  {checklistTotal > 0 && (
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-300" style={{width: `${progressPercent}%`}}></div>
                     </div>
                  )}
                  <div className="space-y-2">
                     {checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 group hover:bg-slate-50 p-1 rounded -ml-1">
                           <input type="checkbox" checked={item.checked} onChange={() => handleToggleChecklist(idx, item)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
                           <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                        </div>
                     ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                     <Input value={newChecklistText} onChange={e => setNewChecklistText(e.target.value)} placeholder="Thêm một mục..." className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && handleAddChecklist()}/>
                     <Button size="sm" variant="secondary" onClick={handleAddChecklist} disabled={!newChecklistText}>Thêm</Button>
                  </div>
               </div>
            </div>

            {/* Comments */}
            <div className="space-y-4 pt-4 border-t">
               <div className="flex items-center gap-2 text-slate-700 font-semibold">
                 <MessageSquare className="w-5 h-5" /> <h3>Bình luận ({comments.length})</h3>
               </div>
               <div className="flex gap-2">
                 <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">ME</div>
                 <div className="flex-1 relative">
                    <Textarea 
                      value={newComment} onChange={e => setNewComment(e.target.value)}
                      placeholder="Viết bình luận..." className="pr-10"
                      onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSendComment()}}}
                    />
                    <Button size="icon" className="absolute bottom-2 right-2 h-6 w-6" onClick={handleSendComment} disabled={isAddingComment}>
                       <Send className="w-3 h-3"/>
                    </Button>
                 </div>
               </div>
               <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                 {comments.length === 0 && <p className="text-sm text-slate-400 italic">Chưa có bình luận nào.</p>}
                 {comments.map((c, i) => (
                    <div key={c.commentId || i} className="flex gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs uppercase text-slate-600">
                          {c.username ? c.username.charAt(0) : 'U'}
                       </div>
                       <div>
                          <div className="flex gap-2 items-center">
                             <span className="font-semibold text-sm text-slate-900">{c.username || 'User'}</span>
                             <span className="text-xs text-slate-400">
                               {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), {addSuffix: true, locale: vi}) : ''}
                             </span>
                          </div>
                          <div className="text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700 mt-1">
                             {c.content}
                          </div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="w-full md:w-60 flex flex-col gap-4">
             {/* Due Date Selector */}
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Hạn hoàn thành</label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full text-sm"
                  />
                  {dueDate && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 hover:text-slate-600"
                      onClick={() => setDueDate("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
             </div>
             
             {/* Assignees Selector */}
             <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Thành viên</label>
                <Button variant="outline" className="w-full justify-start text-slate-600" onClick={() => setShowMemberSelect(!showMemberSelect)}>
                   <User className="w-4 h-4 mr-2"/> Chọn thành viên
                </Button>
                {showMemberSelect && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border shadow-lg rounded-lg p-2 z-50 max-h-48 overflow-y-auto">
                     {projectMembers.map(m => {
                        const uId = m.user?.id || m.user_id; 
                        const uName = m.user?.name || m.name || uId;
                        const isSelected = tempAssignees.includes(uId);
                        return (
                        <div key={uId} onClick={() => handleToggleAssignee(uId)} className={`flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer rounded text-sm ${isSelected ? 'bg-blue-50 text-blue-600' : ''}`}>
                           <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px]">{uName.charAt(0)}</div>
                           <span className="truncate flex-1">{uName}</span>
                           {isSelected && <CheckSquare className="w-3 h-3"/>}
                        </div>
                     )})}
                  </div>
                )}
             </div>

             {/* Labels Selector */}
             <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nhãn màu</label>
                <Button variant="outline" className="w-full justify-start text-slate-600" onClick={() => setShowLabelSelect(!showLabelSelect)}>
                   <Tag className="w-4 h-4 mr-2"/> Chọn nhãn
                </Button>
                {showLabelSelect && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border shadow-lg rounded-lg p-2 z-50 max-h-48 overflow-y-auto">
                     {projectLabels.map(l => {
                        const isSelected = tempLabels.includes(l.id);
                        return (
                        <div key={l.id} onClick={() => handleToggleLabel(l.id)} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer rounded mb-1">
                           <div className="w-full h-8 rounded flex items-center px-2 text-white text-xs font-medium" style={{backgroundColor: l.color || '#ccc'}}>
                              {l.text}
                              {isSelected && <CheckSquare className="w-4 h-4 ml-auto text-white"/>}
                           </div>
                        </div>
                     )})}
                  </div>
                )}
             </div>

             <div className="border-t pt-4 mt-2 space-y-2">
                <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSaving || isUpdating}>
                   {isSaving || isUpdating ? <Loader2 className="animate-spin mr-2 w-4 h-4"/> : <Save className="w-4 h-4 mr-2"/>} 
                   {isSaving || isUpdating ? "Đang lưu..." : "Lưu"}
                </Button>
                <Button onClick={handleDelete} variant="ghost" className="w-full text-red-600 hover:bg-red-50" disabled={isDeletingTask}>
                   <Trash2 className="w-4 h-4 mr-2"/> {isDeletingTask ? "Đang xóa..." : "Xóa thẻ"}
                </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}