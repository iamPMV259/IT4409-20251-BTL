import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileText, CheckSquare, Calendar, Folder, X } from 'lucide-react';
import { searchApi, ProjectSearchResponse, TaskSearchResponse } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { Badge } from './ui/badge';

interface GlobalSearchProps {
  onNavigateToProject?: (projectId: string, projectName: string) => void;
  onNavigateToTask?: (taskId: string, projectId: string) => void;
}

export function GlobalSearch({ onNavigateToProject, onNavigateToTask }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectSearchResponse[]>([]);
  const [tasks, setTasks] = useState<TaskSearchResponse[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Search khi query thay đổi
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setProjects([]);
        setTasks([]);
        return;
      }

      setIsLoading(true);
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          searchApi.searchProjects(debouncedQuery),
          searchApi.searchTasks(debouncedQuery),
        ]);

        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        console.error('Search error:', error);
        setProjects([]);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Close dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectClick = (project: ProjectSearchResponse) => {
    if (onNavigateToProject) {
      onNavigateToProject(project.id, project.name);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleTaskClick = (task: TaskSearchResponse) => {
    if (onNavigateToTask) {
      onNavigateToTask(task.id, task.projectId);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setQuery('');
    setProjects([]);
    setTasks([]);
  };

  const totalResults = projects.length + tasks.length;
  const hasResults = totalResults > 0;
  const showDropdown = isOpen && (query.length >= 2);

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search tasks, projects..."
          className="w-full pl-10 pr-10 py-2 bg-slate-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-slate-200 max-h-[480px] overflow-y-auto z-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {/* Projects Section */}
              {projects.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Projects ({projects.length})
                  </div>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className="w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Folder className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {project.name}
                          </p>
                          {project.description && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {project.status}
                            </Badge>
                            {project.deadline && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(project.deadline).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks Section */}
              {tasks.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-t border-slate-100">
                    Tasks ({tasks.length})
                  </div>
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-slate-500">
                              {task.projectName} / {task.columnName}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-orange-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </span>
                            )}
                            {task.labels.map((label) => (
                              <Badge key={label.labelId} variant="secondary" className="text-xs">
                                {label.text}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
