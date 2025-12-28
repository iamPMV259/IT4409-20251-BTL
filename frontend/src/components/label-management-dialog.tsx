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
import { Plus, Loader2, Tag } from "lucide-react";
import { projectApi, Label as LabelType } from "../lib/api";
import { toast } from "sonner";

interface LabelManagementDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#d946ef", // Fuchsia
  "#64748b", // Slate
];

export function LabelManagementDialog({
  projectId,
  isOpen,
  onClose,
}: LabelManagementDialogProps) {
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [newLabelText, setNewLabelText] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Fetch labels khi mở dialog
  useEffect(() => {
    if (isOpen && projectId) {
      const fetchLabels = async () => {
        setIsLoading(true);
        try {
          const { data } = await projectApi.getLabels(projectId);
          setLabels(data);
        } catch (error) {
          toast.error("Lỗi tải danh sách nhãn");
        } finally {
          setIsLoading(false);
        }
      };
      fetchLabels();
    }
  }, [isOpen, projectId]);

  const handleCreateLabel = async () => {
    if (!newLabelText.trim()) return;
    setIsCreating(true);
    try {
      // API nhận vào mảng labels
      const { data } = await projectApi.createLabel(projectId, [
        { text: newLabelText, color: selectedColor },
      ]);

      toast.success("Đã tạo nhãn mới");
      // Cập nhật list local (API trả về mảng các nhãn vừa tạo)
      if (Array.isArray(data)) {
        setLabels([...labels, ...data]);
      } else {
        // Fallback nếu API trả về 1 object (tùy backend implement)
        // Giả sử reload lại list cho chắc
        const { data: newData } = await projectApi.getLabels(projectId);
        setLabels(newData);
      }

      setNewLabelText("");
    } catch (error) {
      toast.error("Lỗi tạo nhãn");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Quản lý Nhãn</DialogTitle>
          <DialogDescription>
            Tạo và xem danh sách nhãn của dự án.
          </DialogDescription>
        </DialogHeader>

        {/* Danh sách nhãn hiện có */}
        <div className="space-y-2 my-4 max-h-[200px] overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-blue-500" />
            </div>
          ) : labels.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center">
              Chưa có nhãn nào.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels.map((l) => (
                <div
                  key={l.id}
                  className="px-3 py-1 rounded text-white text-sm font-medium flex items-center shadow-sm"
                  style={{ backgroundColor: l.color || "#ccc" }}
                >
                  {l.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form tạo nhãn mới */}
        <div className="border-t pt-4 space-y-3">
          <Label>Tạo nhãn mới</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Tên nhãn (VD: Bug, Feature...)"
              value={newLabelText}
              onChange={(e) => setNewLabelText(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs text-slate-500 mb-2 block">
              Chọn màu
            </Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-slate-800 scale-110 ring-2 ring-offset-1"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreateLabel}
            disabled={isCreating || !newLabelText.trim()}
            className="
    w-full mt-3
    bg-blue-600 text-white
    hover:bg-blue-700
    active:bg-blue-800
    disabled:bg-slate-300 disabled:text-slate-500
    shadow-sm
    transition-all
  "
          >
            {isCreating ? (
              <Loader2 className="animate-spin mr-2 w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Tạo nhãn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
