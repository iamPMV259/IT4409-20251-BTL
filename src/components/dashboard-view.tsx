import React, { useState } from 'react';
import { Plus, Users, CheckCircle2, Circle, Search, SlidersHorizontal } from 'lucide-react';
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

type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Archived';
type UserRole = 'Owner' | 'Admin' | 'Developer' | 'Member' | 'Viewer';
type SortOption = 'last-updated' | 'alphabetical' | 'deadline';

interface Project {
  id: string;
  title: string;
  members: { name: string; avatar: string }[];
  color: string;
  openTasks: number;
  closedTasks: number;
  userRole: UserRole;
  status: ProjectStatus;
  lastUpdated: Date;
  deadline?: Date;
}

interface DashboardViewProps {
  onOpenProject: (projectId: string) => void;
}

export function DashboardView({ onOpenProject }: DashboardViewProps) {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      title: 'Website Redesign',
      members: [
        { name: 'John Doe', avatar: '' },
        { name: 'Jane Smith', avatar: '' },
        { name: 'Bob Wilson', avatar: '' },
        { name: 'Alice Johnson', avatar: '' },
        { name: 'Charlie Brown', avatar: '' },
      ],
      color: 'from-blue-500 to-blue-600',
      openTasks: 15,
      closedTasks: 82,
      userRole: 'Admin',
      status: 'Active',
      lastUpdated: new Date('2025-10-22'),
      deadline: new Date('2025-11-15'),
    },
    {
      id: '2',
      title: 'Mobile App Development',
      members: [
        { name: 'Alice Johnson', avatar: '' },
        { name: 'Charlie Brown', avatar: '' },
        { name: 'David Kim', avatar: '' },
      ],
      color: 'from-purple-500 to-purple-600',
      openTasks: 23,
      closedTasks: 45,
      userRole: 'Developer',
      status: 'Active',
      lastUpdated: new Date('2025-10-23'),
      deadline: new Date('2025-12-01'),
    },
    {
      id: '3',
      title: 'Marketing Campaign',
      members: [
        { name: 'Sarah Davis', avatar: '' },
        { name: 'Mike Anderson', avatar: '' },
        { name: 'Emma Wilson', avatar: '' },
        { name: 'Tom Harris', avatar: '' },
      ],
      color: 'from-green-500 to-green-600',
      openTasks: 8,
      closedTasks: 120,
      userRole: 'Member',
      status: 'Completed',
      lastUpdated: new Date('2025-10-20'),
      deadline: new Date('2025-10-25'),
    },
    {
      id: '4',
      title: 'Product Launch Q4',
      members: [
        { name: 'Lisa Chen', avatar: '' },
        { name: 'David Kim', avatar: '' },
        { name: 'John Doe', avatar: '' },
      ],
      color: 'from-orange-500 to-orange-600',
      openTasks: 32,
      closedTasks: 18,
      userRole: 'Owner',
      status: 'Active',
      lastUpdated: new Date('2025-10-21'),
      deadline: new Date('2025-10-30'),
    },
    {
      id: '5',
      title: 'API Integration',
      members: [
        { name: 'John Doe', avatar: '' },
        { name: 'Jane Smith', avatar: '' },
      ],
      color: 'from-indigo-500 to-indigo-600',
      openTasks: 5,
      closedTasks: 40,
      userRole: 'Admin',
      status: 'On Hold',
      lastUpdated: new Date('2025-10-18'),
      deadline: new Date('2025-11-30'),
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('last-updated');

  const handleCreateProject = () => {
    if (newProjectTitle.trim()) {
      const colors = [
        'from-blue-500 to-blue-600',
        'from-purple-500 to-purple-600',
        'from-green-500 to-green-600',
        'from-orange-500 to-orange-600',
        'from-pink-500 to-pink-600',
        'from-indigo-500 to-indigo-600',
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      setProjects([
        ...projects,
        {
          id: Date.now().toString(),
          title: newProjectTitle,
          members: [{ name: 'John Doe', avatar: '' }],
          color: randomColor,
          openTasks: 0,
          closedTasks: 0,
          userRole: 'Owner',
          status: 'Active',
          lastUpdated: new Date(),
        },
      ]);
      setNewProjectTitle('');
      setIsDialogOpen(false);
    }
  };

  const calculateProgress = (project: Project) => {
    const total = project.openTasks + project.closedTasks;
    if (total === 0) return 0;
    return Math.round((project.closedTasks / total) * 100);
  };

  // Filter and sort projects
  const filteredAndSortedProjects = () => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(project =>
        selectedStatuses.includes(project.status)
      );
    }

    // Role filter
    if (selectedRoles.length > 0) {
      filtered = filtered.filter(project =>
        selectedRoles.includes(project.userRole)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.getTime() - b.deadline.getTime();
        case 'last-updated':
        default:
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      }
    });

    return filtered;
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'On Hold':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'Completed':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'Archived':
        return 'bg-slate-500/10 text-slate-700 border-slate-200';
    }
  };

  const toggleStatus = (status: ProjectStatus) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const toggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const activeFilterCount = 
    (searchQuery ? 1 : 0) + 
    selectedStatuses.length + 
    selectedRoles.length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">My Workspace</h1>
        <p className="text-slate-600">Manage your projects and collaborate with your team</p>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Status
                {selectedStatuses.length > 0 && (
                  <Badge className="ml-1 bg-blue-600">{selectedStatuses.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['Active', 'On Hold', 'Completed', 'Archived'] as ProjectStatus[]).map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Role Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Role
                {selectedRoles.length > 0 && (
                  <Badge className="ml-1 bg-blue-600">{selectedRoles.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Your Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['Owner', 'Admin', 'Developer', 'Member', 'Viewer'] as UserRole[]).map(role => (
                <DropdownMenuCheckboxItem
                  key={role}
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                >
                  {role}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Options */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-updated">Last Updated</SelectItem>
              <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
              <SelectItem value="deadline">Deadline (Nearest)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Info */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-600">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatuses([]);
                setSelectedRoles([]);
              }}
            >
              Clear all
            </Button>
          </div>
        )}
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
                Create new project
              </span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Give your project a name to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Website Redesign"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateProject();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Project Cards */}
        {filteredAndSortedProjects().map((project) => {
          const progress = calculateProgress(project);

          return (
            <button
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group aspect-[4/3] rounded-xl bg-white shadow-sm hover:shadow-lg border border-slate-200 hover:border-blue-300 transition-all overflow-hidden text-left"
            >
              {/* Header with gradient */}
              <div
                className={`h-20 bg-gradient-to-br ${project.color} p-4 flex items-center justify-between`}
              >
                <h3 className="text-white line-clamp-2 flex-1">{project.title}</h3>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm shrink-0 ml-2">
                  {project.userRole}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  {project.deadline && (
                    <span className="text-slate-500">
                      Due {project.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Progress</span>
                    <span className="text-slate-900">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Task Count */}
                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{project.openTasks} Open</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">{project.closedTasks} Closed</span>
                  </div>
                </div>

                {/* Team Section */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">
                      {project.members.length} Members
                    </span>
                  </div>
                  <div className="flex items-center -space-x-2">
                    {project.members.slice(0, 3).map((member, index) => (
                      <Avatar key={index} className="w-6 h-6 border-2 border-white">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-slate-200 text-slate-700">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.members.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-700">
                        <span>+{project.members.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filteredAndSortedProjects().length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-600">No projects found matching your filters</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatuses([]);
                setSelectedRoles([]);
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
