import { Loader2, Mail, UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { workspaceApi } from '../lib/api';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  onSuccess?: () => void;
}

interface MemberToAdd {
  email: string;
  role: 'member' | 'admin';
}

export function AddMemberDialog({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  onSuccess,
}: AddMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [members, setMembers] = useState<MemberToAdd[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToList = () => {
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    // Check duplicate
    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      toast.error('Email đã có trong danh sách');
      return;
    }

    setMembers([...members, { email: email.trim(), role }]);
    setEmail('');
    setRole('member');
  };

  const handleRemoveFromList = (emailToRemove: string) => {
    setMembers(members.filter((m) => m.email !== emailToRemove));
  };

  const handleSubmit = async () => {
    if (members.length === 0) {
      // If no members in list, try to add current input
      if (email.trim()) {
        handleAddToList();
        return;
      }
      toast.error('Vui lòng thêm ít nhất một thành viên');
      return;
    }

    setIsLoading(true);
    try {
      await workspaceApi.addMembers(
        workspaceId,
        members.map((m) => ({ userEmail: m.email, role: m.role }))
      );
      toast.success(`Đã thêm ${members.length} thành viên vào workspace`);
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Add members error:', error);
      if (error.response?.status === 404) {
        toast.error('Không tìm thấy người dùng với email này');
      } else if (error.response?.status === 400) {
        toast.error('Thành viên đã tồn tại trong workspace');
      } else {
        toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    setMembers([]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddToList();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Thêm thành viên
          </DialogTitle>
          <DialogDescription>
            Thêm thành viên mới vào workspace <strong>{workspaceName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Input email */}
          <div className="space-y-2">
            <Label>Email thành viên</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Select value={role} onValueChange={(v) => setRole(v as 'member' | 'admin')}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddToList}
                disabled={!email.trim()}
              >
                Thêm
              </Button>
            </div>
          </div>

          {/* Members list */}
          {members.length > 0 && (
            <div className="space-y-2">
              <Label>Danh sách thành viên ({members.length})</Label>
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between p-2 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{member.email}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          member.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFromList(member.email)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || (members.length === 0 && !email.trim())}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Thêm {members.length > 0 ? `(${members.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
