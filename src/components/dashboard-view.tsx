import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Loader2, Briefcase } from 'lucide-react'; // Thêm icon Briefcase
import { Button } from './ui/button';
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
import { workspaceApi, projectApi, Project, Workspace } from '../lib/api';
import { toast } from 'sonner';

interface DashboardViewProps {
  onOpenProject: (projectId: string, projectTitle: string) => void;
}

export function DashboardView({ onOpenProject }: DashboardViewProps) {
  // --- Data States ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  // --- UI States: Create Project ---
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // --- UI States: Create Workspace (MỚI) ---
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Workspaces khi load trang
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data } = await workspaceApi.getAll();
        setWorkspaces(data);
        
        // Tự động chọn workspace đầu tiên nếu có
        if (data.length > 0) {
          setCurrentWorkspaceId(data[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách Workspace");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // 2. Fetch Projects khi Workspace thay đổi
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentWorkspaceId) {
        setProjects([]);
        return;
      }
      
      setIsProjectsLoading(true);
      try {
        const { data } = await projectApi.getAllByWorkspace(currentWorkspaceId);
        setProjects(data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách dự án");
      } finally {
        setIsProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [currentWorkspaceId]);

  // 3. Xử lý tạo Project
  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || !currentWorkspaceId) return;
    
    setIsCreatingProject(true);
    try {
      const { data: newProject } = await projectApi.create(currentWorkspaceId, {
        name: newProjectTitle,
        description: "Được tạo từ TaskFlow Web"
      });
      setProjects([...projects, newProject]);
      setNewProjectTitle('');
      setIsProjectDialogOpen(false);
      toast.success("Tạo dự án thành công!");
    } catch (error) {
      toast.error("Tạo dự án thất bại");
    } finally {
      setIsCreatingProject(false);
    }
  };

  // 4. Xử lý tạo Workspace (LOGIC MỚI)
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    setIsCreatingWorkspace(true);
    try {
      const { data: newWorkspace } = await workspaceApi.create(newWorkspaceName);
      
      // Cập nhật danh sách và chọn luôn workspace mới tạo
      const updatedWorkspaces = [...workspaces, newWorkspace];
      setWorkspaces(updatedWorkspaces);
      setCurrentWorkspaceId(newWorkspace.id);
      
      setNewWorkspaceName('');
      setIsWorkspaceDialogOpen(false);
      toast.success("Tạo Workspace thành công!");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail?.[0]?.msg || "Tạo Workspace thất bại";
      toast.error(msg);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // Helper lọc dự án client-side
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- RENDER ---

  // Loading ban đầu
  if (isLoadingData) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600"/></div>;
  }

  // Trường hợp User chưa có Workspace nào -> Bắt buộc tạo
  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Chào mừng đến với TaskFlow!</h2>
          <p className="text-slate-600 mb-6">
            Bạn chưa tham gia Workspace nào. Hãy tạo một không gian làm việc mới để bắt đầu quản lý dự án.
          </p>
          
          <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="space-y-2 text-left">
              <Label>Tên Workspace</Label>
              <Input 
                placeholder="Ví dụ: Công ty ABC" 
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={handleCreateWorkspace}
              disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
            >
              {isCreatingWorkspace ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>}
              Tạo Workspace Mới
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">My Workspace</h1>
        <p className="text-slate-600">Quản lý các dự án trong không gian làm việc của bạn.</p>
      </div>

      {/* Controls Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm dự án..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Workspace Selector + Create Workspace Trigger */}
          <div className="flex gap-2">
            <Select 
              value={currentWorkspaceId || ''} 
              onValueChange={(val) => {
                if (val === 'CREATE_NEW') {
                  setIsWorkspaceDialogOpen(true);
                } else {
                  setCurrentWorkspaceId(val);
                }
              }}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Chọn Workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
                {/* Option đặc biệt để mở Dialog tạo mới */}
                <div className="p-1 border-t border-slate-100 mt-1">
                  <SelectItem value="CREATE_NEW" className="text-blue-600 font-medium cursor-pointer">
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" /> Tạo Workspace mới
                    </div>
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card: Create New Project */}
        <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
          <DialogTrigger asChild>
            <button className="group aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
              </div>
              <span className="text-slate-600 group-hover:text-blue-600 transition-colors font-medium">
                Tạo dự án mới
              </span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo dự án mới</DialogTitle>
              <DialogDescription>Dự án sẽ được tạo trong <strong>{workspaces.find(w => w.id === currentWorkspaceId)?.name}</strong></DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tên dự án</Label>
                <Input
                  placeholder="Ví dụ: Website Redesign"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700" disabled={isCreatingProject}>
                  {isCreatingProject ? 'Đang tạo...' : 'Tạo dự án'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Project Cards List */}
        {isProjectsLoading ? (
           // Skeleton loading đơn giản
           [1,2].map(i => <div key={i} className="aspect-[4/3] rounded-xl bg-slate-100 animate-pulse" />)
        ) : (
          filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => onOpenProject(project.id, project.name)}
              className="group aspect-[4/3] rounded-xl bg-white shadow-sm hover:shadow-lg border border-slate-200 hover:border-blue-300 transition-all overflow-hidden text-left flex flex-col"
            >
              <div className="h-20 bg-gradient-to-br from-blue-500 to-blue-600 p-4 flex items-center justify-between w-full">
                <h3 className="text-white line-clamp-2 flex-1 font-medium text-lg">{project.name}</h3>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm shrink-0 ml-2">
                  {project.status || 'Active'}
                </Badge>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                  {project.description || "Chưa có mô tả."}
                </p>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500 text-sm">
                    {project.members ? project.members.length : 1} Thành viên
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Dialog: Create Workspace (Ẩn, được kích hoạt bởi Select hoặc Empty State) */}
      <Dialog open={isWorkspaceDialogOpen} onOpenChange={setIsWorkspaceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Workspace mới</DialogTitle>
            <DialogDescription>Tạo không gian làm việc mới cho team của bạn.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Tên Workspace</Label>
              <Input 
                placeholder="Ví dụ: Team Marketing" 
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsWorkspaceDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleCreateWorkspace} className="bg-blue-600 hover:bg-blue-700" disabled={isCreatingWorkspace}>
                {isCreatingWorkspace ? 'Đang tạo...' : 'Tạo Workspace'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}