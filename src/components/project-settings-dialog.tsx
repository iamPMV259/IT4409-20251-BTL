import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Trash2, Save, Loader2, AlertTriangle } from "lucide-react";
import { projectApi } from "../lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; // Hoặc dùng callback onBack

interface ProjectSettingsDialogProps {
  projectId: string;
  currentTitle: string;
  currentDescription?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newName: string, newDescription: string) => void;
  onDeleteSuccess: () => void; // Để redirect về Dashboard sau khi xóa
}

export function ProjectSettingsDialog({
  projectId,
  currentTitle,
  currentDescription = "",
  isOpen,
  onClose,
  onUpdate,
  onDeleteSuccess,
}: ProjectSettingsDialogProps) {
  const [name, setName] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state khi mở modal
  useEffect(() => {
    if (isOpen) {
      setName(currentTitle);
      setDescription(currentDescription || "");
    }
  }, [isOpen, currentTitle, currentDescription]);

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await projectApi.update(projectId, { name, description });
      toast.success("Cập nhật dự án thành công");
        onUpdate(name, description);
      onClose();
    } catch (error) {
      toast.error("Lỗi cập nhật dự án");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "CẢNH BÁO: Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa dự án này?"
      )
    )
      return;

    setIsLoading(true);
    try {
      await projectApi.delete(projectId);
      toast.success("Đã xóa dự án");
      onDeleteSuccess();
    } catch (error) {
      toast.error("Không thể xóa (Bạn có phải Owner không?)");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cài đặt Dự án</DialogTitle>
          <DialogDescription>
            Quản lý thông tin chung và cấu hình dự án.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Tên dự án</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về dự án này..."
            />
          </div>
        </div>

        {/* Khu vực nguy hiểm */}
        <div className="border-t pt-4 mt-2">
          <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Khu vực nguy hiểm
          </h4>
          <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-100">
            <span className="text-sm text-red-800">
              Xóa vĩnh viễn dự án này
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Xóa
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}{" "}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
