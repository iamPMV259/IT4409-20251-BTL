import {
    Hash,
    LayoutGrid,
    Loader2,
    Plus,
    Shield,
    User,
    UserPlus
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/auth-context';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { AddMemberDialog } from './add-member-dialog';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

interface DashboardViewProps {
  onOpenProject: (projectId: string, projectTitle: string) => void;
}

export function DashboardView({ onOpenProject }: DashboardViewProps) {
  const { logout, user } = useAuth();
  
  // Use React Query hooks
  const {
    workspaces,
    isLoadingWorkspaces,
    joinedProjects,
    isLoadingProjects,
    createWorkspace,
    isCreatingWorkspace,
    createProject,
    isCreatingProject,
  } = useWorkspaces();

  // Local UI State
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

  // Handlers
  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    createWorkspace(newWorkspaceName, {
      onSuccess: () => {
        setNewWorkspaceName('');
        setIsWorkspaceDialogOpen(false);
        toast.success('Đã tạo Workspace');
      },
      onError: () => {
        toast.error('Lỗi tạo Workspace');
      },
    });
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim() || currentWorkspaceId === 'ALL') return;
    createProject(
      {
        workspaceId: currentWorkspaceId,
        name: newProjectName,
        description: newProjectDesc,
      },
      {
        onSuccess: () => {
          setIsProjectDialogOpen(false);
          setNewProjectName('');
          setNewProjectDesc('');
          toast.success('Đã tạo dự án');
        },
        onError: () => {
          toast.error('Lỗi tạo dự án');
        },
      }
    );
  };

  // Filter - Memoize để tránh re-compute không cần thiết
  const filteredProjects = useMemo(() => {
    const projects = joinedProjects || [];
    const workspaceProjects =
      currentWorkspaceId === 'ALL'
        ? projects
        : projects.filter((p) => p.workspace_id === currentWorkspaceId);

    return workspaceProjects.filter((p) =>
      p.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [joinedProjects, currentWorkspaceId, searchQuery]);

  const isLoadingInit = isLoadingWorkspaces || isLoadingProjects;

  if (isLoadingInit) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-blue-600" />
            Dashboard
          </h1>
          <p className="text-slate-600">
            Xin chào{' '}
            <span className="font-semibold text-slate-900">
              {user?.name}
            </span>
            , bạn đang tham gia{' '}
            <span className="font-bold text-blue-600">
              {(joinedProjects || []).length}
            </span>{' '}
            dự án.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-8 flex flex-col lg:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border shadow-sm">
        <Select
          value={currentWorkspaceId}
          onValueChange={val =>
            val === 'CREATE_NEW'
              ? setIsWorkspaceDialogOpen(true)
              : setCurrentWorkspaceId(val)
          }
        >
          <SelectTrigger className="w-full lg:w-[260px]">
            <SelectValue placeholder="Chọn Workspace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả Workspaces</SelectItem>
            {(workspaces || []).map(w => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
            <SelectItem value="CREATE_NEW" className="text-blue-600">
              <Plus className="w-4 h-4 inline mr-2" />
              Tạo Workspace mới
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Add Member Button - only show when a workspace is selected */}
        {currentWorkspaceId !== 'ALL' && (
          <Button
            variant="outline"
            onClick={() => setIsAddMemberDialogOpen(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Thêm thành viên
          </Button>
        )}
      </div>


      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Card: Create New Project */}
        {currentWorkspaceId !== 'ALL' && (

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
              <DialogDescription>Dự án sẽ được tạo trong <strong>{(workspaces || []).find(w => w.id === currentWorkspaceId)?.name}</strong></DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tên dự án</Label>
                <Input
                  placeholder="Ví dụ: Website Redesign"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
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
        
        )}
        {filteredProjects.map(project => {
          const workspaceName =
            (workspaces || []).find(w => w.id === project.workspace_id)
              ?.name || 'Shared Project';

          const displayName =
            !project.project_name || project.project_name === 'string'
              ? 'Dự án mẫu (Untitled)'
              : project.project_name;

          return (
            <button
              key={project.project_id}
              onClick={() =>
                onOpenProject(project.project_id, displayName)
              }
              className="group flex flex-col h-[200px] rounded-2xl bg-white border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden"
            >
              {/* ===== FIXED HEADER ===== */}
              <div className="h-2/5 bg-blue-600 p-4 flex flex-col justify-between">
                <div className="flex justify-end">
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur text-white text-[10px] font-bold uppercase px-2 py-1 rounded-full">
                    {project.role === 'owner' ? (
                      <Shield className="w-3 h-3" fill="currentColor" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    {project.role}
                  </div>
                </div>

                <h3
                  className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm"
                  title={displayName}
                >
                  {displayName}
                </h3>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="text-sm text-slate-500 truncate">
                  {workspaceName}
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1 truncate">
                    <Hash className="w-3 h-3" />
                    {project.project_id.slice(0, 8)}...
                  </span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Workspace Dialog */}
      <Dialog
        open={isWorkspaceDialogOpen}
        onOpenChange={setIsWorkspaceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Workspace mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Label>Tên Workspace</Label>
            <Input
              value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
            />
            <Button onClick={handleCreateWorkspace} className="w-full">
              Tạo Workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      {currentWorkspaceId !== 'ALL' && (
        <AddMemberDialog
          isOpen={isAddMemberDialogOpen}
          onClose={() => setIsAddMemberDialogOpen(false)}
          workspaceId={currentWorkspaceId}
          workspaceName={(workspaces || []).find(w => w.id === currentWorkspaceId)?.name || 'Workspace'}
        />
      )}
    </div>
  );
}
