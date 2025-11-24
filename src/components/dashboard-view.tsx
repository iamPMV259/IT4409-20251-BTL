import React, { useState, useEffect } from 'react';
import { Plus, Users, CheckCircle2, Circle, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { workspaceApi, projectApi, Project, Workspace } from '../lib/api';
import { toast } from 'sonner';

// Các type phụ trợ cho filter giao diện (giữ lại để dùng sau nếu API hỗ trợ filter)
type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Archived';
type UserRole = 'Owner' | 'Admin' | 'Developer' | 'Member' | 'Viewer';
type SortOption = 'last-updated' | 'alphabetical' | 'deadline';

interface DashboardViewProps {
  onOpenProject: (projectId: string, projectTitle: string) => void;
}

export function DashboardView({ onOpenProject }: DashboardViewProps) {
  // State dữ liệu từ API
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State cho việc tạo project
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // State cho filter/sort (hiện tại filter client-side)
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('last-updated');

  // 1. Fetch Workspaces khi component mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data } = await workspaceApi.getAll();
        setWorkspaces(data);
        if (data.length > 0) {
          setCurrentWorkspaceId(data[0]._id);
        } else {
          // Nếu chưa có workspace nào, dừng loading để hiện thị state rỗng
          setIsLoading(false);
        }
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách workspace");
        setIsLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // 2. Fetch Projects khi Workspace thay đổi
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentWorkspaceId) return;
      
      setIsLoading(true);
      try {
        const { data } = await projectApi.getAllByWorkspace(currentWorkspaceId);
        setProjects(data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách dự án");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [currentWorkspaceId]);

  // 3. Xử lý tạo Project mới
  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || !currentWorkspaceId) return;
    
    setIsCreating(true);
    try {
      const { data: newProject } = await projectApi.create(currentWorkspaceId, {
        name: newProjectTitle,
        description: "Được tạo từ TaskFlow Web" // Có thể thêm input description sau
      });
      
      setProjects([...projects, newProject]);
      setNewProjectTitle('');
      setIsDialogOpen(false);
      toast.success("Đã tạo dự án thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Tạo dự án thất bại");
    } finally {
      setIsCreating(false);
    }
  };

  // Helper để lọc và sắp xếp project (Client-side)
  const filteredAndSortedProjects = () => {
    let filtered = [...projects];

    if (searchQuery.trim()) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      // Mặc định sort theo ID (tạm thời coi như tạo sau ID lớn hơn hoặc dùng created_at nếu có)
      return 0; 
    });

    return filtered;
  };

  // UI Loading
  if (isLoading && projects.length === 0 && workspaces.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  const activeFilterCount = searchQuery ? 1 : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">My Workspace</h1>
        <p className="text-slate-600">
          {workspaces.find(w => w._id === currentWorkspaceId)?.name || "Đang tải..."}
        </p>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm dự án..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Workspace Selector (Nếu có nhiều workspace) */}
          {workspaces.length > 1 && (
             <Select 
                value={currentWorkspaceId || ''} 
                onValueChange={setCurrentWorkspaceId}
             >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn Workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map(w => (
                  <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort Options */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sắp xếp..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-updated">Mới nhất</SelectItem>
              <SelectItem value="alphabetical">Tên (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Project Card */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="group aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
              </div>
              <span className="text-slate-600 group-hover:text-blue-600 transition-colors">
                Tạo dự án mới
              </span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo dự án mới</DialogTitle>
              <DialogDescription>
                Nhập tên dự án để bắt đầu quản lý công việc ngay.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Tên dự án</Label>
                <Input
                  id="project-name"
                  placeholder="Ví dụ: Website Redesign"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateProject();
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isCreating}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateProject}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isCreating ? 'Đang tạo...' : 'Tạo dự án'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Project Cards */}
        {filteredAndSortedProjects().map((project) => (
          <button
            key={project._id}
            onClick={() => onOpenProject(project._id, project.name)}
            className="group aspect-[4/3] rounded-xl bg-white shadow-sm hover:shadow-lg border border-slate-200 hover:border-blue-300 transition-all overflow-hidden text-left flex flex-col"
          >
            {/* Header with gradient */}
            <div className="h-20 bg-gradient-to-br from-blue-500 to-blue-600 p-4 flex items-center justify-between w-full">
              <h3 className="text-white line-clamp-2 flex-1 font-medium text-lg">{project.name}</h3>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm shrink-0 ml-2 hover:bg-white/30">
                {project.status || 'Active'}
              </Badge>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                  {project.description || "Chưa có mô tả cho dự án này."}
                </p>
              </div>

              {/* Team Section - Giả lập hiển thị members nếu API chưa trả về chi tiết */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500 text-sm">
                    {project.members ? project.members.length : 1} Thành viên
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Empty State */}
        {!isLoading && filteredAndSortedProjects().length === 0 && projects.length > 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-600">Không tìm thấy dự án phù hợp.</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}