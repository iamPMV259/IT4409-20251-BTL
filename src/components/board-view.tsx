import React, { useState } from 'react';
import { Plus, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { BoardColumn } from './board-column';
import { CardDetailModal } from './card-detail-modal';
import { Task } from './task-card';
import { Input } from './ui/input';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface BoardViewProps {
  projectId: string;
  projectTitle: string;
  onBack: () => void;
}

// Detect if touch device
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export function BoardView({ projectId, projectTitle, onBack }: BoardViewProps) {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        {
          id: '1',
          title: 'Design homepage wireframes',
          description: 'Create low-fidelity wireframes for the homepage',
          assignees: [
            { name: 'John Doe', avatar: '' },
            { name: 'Jane Smith', avatar: '' },
          ],
          dueDate: '2025-10-25',
          labels: [{ color: 'bg-purple-500', name: 'Design' }],
          checklist: { total: 5, completed: 2 },
          comments: 3,
          attachments: 1,
        },
        {
          id: '2',
          title: 'Set up development environment',
          assignees: [{ name: 'Bob Wilson', avatar: '' }],
          labels: [{ color: 'bg-blue-500', name: 'Development' }],
          comments: 1,
          attachments: 0,
        },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: [
        {
          id: '3',
          title: 'Implement user authentication',
          description: 'Add login and signup functionality',
          assignees: [{ name: 'Alice Johnson', avatar: '' }],
          dueDate: '2025-10-30',
          labels: [
            { color: 'bg-blue-500', name: 'Development' },
            { color: 'bg-orange-500', name: 'Urgent' },
          ],
          checklist: { total: 3, completed: 1 },
          comments: 5,
          attachments: 2,
        },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      tasks: [
        {
          id: '4',
          title: 'Review design system documentation',
          assignees: [
            { name: 'John Doe', avatar: '' },
            { name: 'Jane Smith', avatar: '' },
          ],
          labels: [{ color: 'bg-purple-500', name: 'Design' }],
          comments: 2,
          attachments: 1,
        },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        {
          id: '5',
          title: 'Project kickoff meeting',
          assignees: [
            { name: 'John Doe', avatar: '' },
            { name: 'Jane Smith', avatar: '' },
            { name: 'Bob Wilson', avatar: '' },
          ],
          labels: [{ color: 'bg-green-500', name: 'Feature' }],
          comments: 8,
          attachments: 3,
        },
        {
          id: '6',
          title: 'Research competitor products',
          assignees: [{ name: 'Jane Smith', avatar: '' }],
          labels: [],
          comments: 4,
          attachments: 5,
        },
      ],
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const teamMembers = [
    { name: 'John Doe', avatar: '' },
    { name: 'Jane Smith', avatar: '' },
    { name: 'Bob Wilson', avatar: '' },
    { name: 'Alice Johnson', avatar: '' },
  ];

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setColumns(
      columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        ),
      }))
    );
  };

  const handleAddTask = (columnId: string, title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      assignees: [],
      labels: [],
      comments: 0,
      attachments: 0,
    };

    setColumns(
      columns.map((column) =>
        column.id === columnId
          ? { ...column, tasks: [...column.tasks, newTask] }
          : column
      )
    );
  };

  const handleMoveTask = (taskId: string, targetColumnId: string) => {
    let movedTask: Task | null = null;

    // Remove task from current column
    const newColumns = columns.map((column) => {
      const task = column.tasks.find((t) => t.id === taskId);
      if (task) {
        movedTask = task;
        return {
          ...column,
          tasks: column.tasks.filter((t) => t.id !== taskId),
        };
      }
      return column;
    });

    // Add task to target column
    if (movedTask) {
      setColumns(
        newColumns.map((column) =>
          column.id === targetColumnId
            ? { ...column, tasks: [...column.tasks, movedTask!] }
            : column
        )
      );
    }
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      setColumns([
        ...columns,
        {
          id: Date.now().toString(),
          title: newColumnTitle,
          tasks: [],
        },
      ]);
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const backend = isTouchDevice() ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={backend}>
      <div className="flex flex-col h-full bg-slate-50">
        {/* Board Header */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Team Members */}
            <div className="flex items-center -space-x-2">
              {teamMembers.map((member, index) => (
                <Avatar
                  key={index}
                  className="w-8 h-8 border-2 border-white"
                  title={member.name}
                >
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-slate-200 text-slate-700">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-full"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Board Content - Desktop */}
        <div className="hidden lg:flex flex-1 overflow-x-auto overflow-y-hidden p-6 gap-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={column.tasks}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
              onMoveTask={handleMoveTask}
            />
          ))}

          {/* Add Column */}
          {isAddingColumn ? (
            <div className="flex-shrink-0 w-80 bg-slate-100 rounded-lg p-3">
              <Input
                placeholder="Enter list title..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddColumn();
                  } else if (e.key === 'Escape') {
                    setIsAddingColumn(false);
                    setNewColumnTitle('');
                  }
                }}
                autoFocus
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddColumn}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add list
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingColumn(false);
                    setNewColumnTitle('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="flex-shrink-0 w-80 justify-start text-slate-600 hover:bg-slate-200 bg-slate-100/50"
              onClick={() => setIsAddingColumn(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add another list
            </Button>
          )}
        </div>

        {/* Board Content - Mobile */}
        <div className="lg:hidden flex-1 overflow-y-auto p-4 space-y-4">
          {columns.map((column) => (
            <div key={column.id} className="bg-slate-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-slate-900">{column.title}</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {column.tasks.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm"
                  >
                    {task.labels && task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.labels.map((label, index) => (
                          <div
                            key={index}
                            className={`${label.color} h-2 w-10 rounded`}
                          />
                        ))}
                      </div>
                    )}
                    <h4 className="text-slate-900 mb-2">{task.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center -space-x-2">
                        {task.assignees.map((assignee, index) => (
                          <Avatar
                            key={index}
                            className="w-6 h-6 border-2 border-white"
                          >
                            <AvatarImage src={assignee.avatar} />
                            <AvatarFallback className="bg-slate-200 text-slate-700">
                              {assignee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {task.dueDate && (
                        <span className="text-slate-500">
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:bg-slate-200 mt-2"
                onClick={() =>
                  handleAddTask(
                    column.id,
                    prompt('Enter task title:') || 'New Task'
                  )
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add a task
              </Button>
            </div>
          ))}
        </div>

        {/* Card Detail Modal */}
        <CardDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={handleUpdateTask}
        />
      </div>
    </DndProvider>
  );
}
