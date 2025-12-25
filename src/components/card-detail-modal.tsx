import React, { useState, useEffect } from "react";
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
  taskApi, projectApi, 
  TaskResponse, Comment, Label 
} from "../lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from 'date-fns/locale';

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
  
  // --- STATE ---
  const [fullTaskData, setFullTaskData] = useState<TaskResponse | null>(null);
  
  // Form Data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // Lists Data
  const [checklist, setChecklist] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Context Data (để map ID -> Name/Color)
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  
  // UI States
  const [newComment, setNewComment] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  
  // Dropdowns
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [showLabelSelect, setShowLabelSelect] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    if (isOpen && task && task.id) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // 1. Gọi API lấy chi tiết Task (Bây giờ đã có đủ comments!)
          const { data: taskData } = await taskApi.getDetail(task.id);
          
          setFullTaskData(taskData);
          setTitle(taskData.title);
          setDescription(taskData.description || "");
          setDueDate(taskData.dueDate ? taskData.dueDate.split('T')[0] : "");
          setChecklist(taskData.checklists || []);
          setComments(taskData.comments || []); // Load comment trực tiếp từ API

          // 2. Lấy thông tin Project để map hiển thị (Labels & Members)
          if (taskData.projectId) {
             // Load Labels
             try {
                const labelsRes = await projectApi.getLabels(taskData.projectId);
                setProjectLabels(labelsRes.data);
             } catch (e) { console.warn("Lỗi tải labels"); }

             // Load Members (Cẩn thận lỗi 403 nếu là member thường)
             try {
               const projectRes = await projectApi.getDetail(taskData.projectId);
               setProjectMembers(projectRes.data.data.members || []);
             } catch (e) { console.warn("Lỗi tải members (có thể do quyền hạn)"); }
          }

        } catch (error) {
          console.error("Lỗi tải task:", error);
          toast.error("Không thể tải chi tiết công việc");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, task]);

  // --- ACTIONS ---

  const handleSave = async () => {
    if (!fullTaskData) return;
    setIsSaving(true);
    try {
      const { data } = await taskApi.update(fullTaskData.id, {
        title, description, dueDate: dueDate || undefined
      });
      toast.success("Đã lưu");
      onUpdate({ ...task, title: data.title, description: data.description, dueDate: data.dueDate });
      onClose();
    } catch { toast.error("Lỗi lưu"); } 
    finally { setIsSaving(false); }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !fullTaskData) return;
    setIsSendingComment(true);
    try {
      // Gọi API post comment
      const { data: newCommentRes } = await taskApi.addComment(fullTaskData.id, newComment);
      
      // Backend trả về comment object chuẩn, ta thêm vào list
      // Lưu ý: Nếu backend API addComment chưa trả về đúng format Comment, ta có thể fake tạm
      const commentToAdd: Comment = {
          commentId: newCommentRes.id || Math.random().toString(),
          content: newComment,
          createdAt: new Date().toISOString(),
          userId: 'me',
          username: 'Tôi', // Hoặc lấy từ user context
          ...newCommentRes // Ghi đè nếu API trả về chuẩn
      };
      
      setComments([...comments, commentToAdd]);
      setNewComment("");
    } catch { toast.error("Lỗi gửi bình luận"); }
    finally { setIsSendingComment(false); }
  };

  // Checklist Handlers
  const handleAddChecklist = async () => {
      if (!newChecklistText.trim() || !fullTaskData) return;
      try {
          await taskApi.addChecklistItem(fullTaskData.id, newChecklistText);
          setChecklist([...checklist, { text: newChecklistText, checked: false }]);
          setNewChecklistText("");
      } catch { toast.error("Lỗi thêm checklist"); }
  };

  const handleToggleChecklist = async (index: number, item: any) => {
      if (!fullTaskData) return;
      const newStatus = !item.checked;
      const newChecklist = [...checklist];
      newChecklist[index].checked = newStatus;
      setChecklist(newChecklist); // Optimistic
      try {
          await taskApi.updateChecklistItem(fullTaskData.id, index, item.text, newStatus);
      } catch { 
          // Revert
          newChecklist[index].checked = !newStatus;
          setChecklist(newChecklist);
      }
  };

  // Toggle Members/Labels
  const handleToggleAssignee = async (userId: string) => {
      if (!fullTaskData) return;
      const isAssigned = fullTaskData.assignees.includes(userId);
      const newAssignees = isAssigned 
          ? fullTaskData.assignees.filter(id => id !== userId)
          : [...fullTaskData.assignees, userId];
      
      setFullTaskData({ ...fullTaskData, assignees: newAssignees }); // Optimistic UI
      try {
          if (isAssigned) await taskApi.removeAssignee(fullTaskData.id, userId);
          else await taskApi.addAssignee(fullTaskData.id, userId);
      } catch { toast.error("Lỗi cập nhật thành viên"); }
  };

  // const handleToggleLabel = async (labelId: string) => {
  //     if (!fullTaskData) return;
  //     if (!fullTaskData.labels.includes(labelId)) {
  //         setFullTaskData({ ...fullTaskData, labels: [...fullTaskData.labels, labelId] });
  //         try { await taskApi.addLabel(fullTaskData.id, labelId); } 
  //         catch { toast.error("Lỗi thêm nhãn"); }
  //     }
  // };
const handleToggleLabel = async (labelId: string) => {
      if (!fullTaskData) return;
      
      // Kiểm tra xem đã có nhãn này chưa
      if (!fullTaskData.labels.includes(labelId)) {
          // 1. Tạo danh sách nhãn mới
          const newLabels = [...fullTaskData.labels, labelId];
          
          // 2. Cập nhật State nội bộ (Optimistic UI)
          const updatedTask = { ...fullTaskData, labels: newLabels };
          setFullTaskData(updatedTask);
          
          try {
              // 3. Gọi API
              await taskApi.addLabel(fullTaskData.id, labelId);
              
              // 4. QUAN TRỌNG: Báo cho BoardView biết để cập nhật UI bên ngoài
              onUpdate(updatedTask);
              
          } catch (error) { 
              toast.error("Lỗi thêm nhãn");
              // Revert nếu lỗi (tùy chọn)
          }
      } else {
          toast.info("Nhãn này đã được thêm rồi");
      }
  };
  
  const handleDelete = async () => {
    // Chỉ cần có task id là xóa được, không cần fullTaskData
    if (!task || !task.id) return; 
    
    if (!window.confirm("Bạn chắc chắn muốn xóa thẻ này?")) return;
    
    try {
      await taskApi.delete(task.id);
      
      // Gọi callback xóa (chỉ cần truyền ID)
      // Lưu ý: props onDelete ở đây cần sửa lại type một chút nếu typescript báo lỗi, 
      // nhưng về mặt logic JS thì truyền thiếu tham số columnId cũng không sao vì hàm mới ở trên không dùng nó.
      onDelete(task.id, ""); 
      
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Xóa thất bại"); 
    }
  };

  // Tính toán checklist progress
  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter(c => c.checked).length;
  const progressPercent = checklistTotal === 0 ? 0 : Math.round((checklistDone / checklistTotal) * 100);

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white" aria-describedby="desc">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="desc">Detail</DialogDescription>
        </DialogHeader>

        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative">
           <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-white/20" onClick={onClose}>
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
                   {fullTaskData?.labels?.map((lId, idx) => {
                      const labelObj = projectLabels.find(l => l.id === lId);
                      return (
                        <Badge key={lId || idx} style={{backgroundColor: labelObj?.color || '#10b981'}} className="text-white hover:brightness-90 px-2 py-1">
                          {labelObj?.text || "Label"}
                        </Badge>
                      );
                   })}
                   
                   {/* Map Assignees ID -> Object */}
                   {fullTaskData?.assignees?.map((uId, idx) => {
                      const member = projectMembers.find(m => m.user?.id === uId || m.user_id === uId);
                      const name = member?.user?.name || member?.name || "User";
                      return (
                         <div key={uId || idx} className="h-6 px-2 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1 text-xs font-medium">
                            <User className="w-3 h-3"/> {name}
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
                    <Button size="icon" className="absolute bottom-2 right-2 h-6 w-6" onClick={handleSendComment} disabled={isSendingComment}>
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
                        const isSelected = fullTaskData?.assignees?.includes(uId);
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
                     {projectLabels.map(l => (
                        <div key={l.id} onClick={() => handleToggleLabel(l.id)} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer rounded mb-1">
                           <div className="w-full h-8 rounded flex items-center px-2 text-white text-xs font-medium" style={{backgroundColor: l.color || '#ccc'}}>
                              {l.text}
                              {fullTaskData?.labels?.includes(l.id) && <CheckSquare className="w-4 h-4 ml-auto text-white"/>}
                           </div>
                        </div>
                     ))}
                  </div>
                )}
             </div>

             <div className="border-t pt-4 mt-2 space-y-2">
                <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                   {isSaving ? <Loader2 className="animate-spin mr-2 w-4 h-4"/> : <Save className="w-4 h-4 mr-2"/>} Lưu
                </Button>
                <Button onClick={handleDelete} variant="ghost" className="w-full text-red-600 hover:bg-red-50">
                   <Trash2 className="w-4 h-4 mr-2"/> Xóa thẻ
                </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}