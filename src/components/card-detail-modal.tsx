import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Task } from './task-card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  AlignLeft,
  User,
  Tag,
  Calendar,
  CheckSquare,
  Paperclip,
  X,
  Plus,
  Send,
} from 'lucide-react';
import { Calendar as CalendarComponent } from './ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface CardDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

export function CardDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
}: CardDetailModalProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checklistItems, setChecklistItems] = useState([
    { id: '1', text: 'Research competitors', completed: true },
    { id: '2', text: 'Create wireframes', completed: true },
    { id: '3', text: 'Design mockups', completed: false },
    { id: '4', text: 'Get stakeholder approval', completed: false },
    { id: '5', text: 'Hand off to development', completed: false },
  ]);

  const [comments] = useState([
    {
      id: '1',
      author: 'Jane Smith',
      avatar: '',
      text: 'I have completed the initial research. The main competitors are using similar layouts.',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      author: 'John Doe',
      avatar: '',
      text: 'Great work! Let us schedule a review meeting for Friday.',
      timestamp: '1 hour ago',
    },
  ]);

  const [activities] = useState([
    {
      id: '1',
      user: 'John Doe',
      action: 'moved this card from "To Do" to "In Progress"',
      timestamp: '3 hours ago',
    },
    {
      id: '2',
      user: 'Jane Smith',
      action: 'added a checklist',
      timestamp: '4 hours ago',
    },
    {
      id: '3',
      user: 'John Doe',
      action: 'created this card',
      timestamp: '1 day ago',
    },
  ]);

  React.useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!editedTask) return null;

  const completedItems = checklistItems.filter((item) => item.completed).length;
  const totalItems = checklistItems.length;
  const progress = (completedItems / totalItems) * 100;

  const availableLabels = [
    { name: 'Design', color: 'bg-purple-500' },
    { name: 'Development', color: 'bg-blue-500' },
    { name: 'Bug', color: 'bg-red-500' },
    { name: 'Feature', color: 'bg-green-500' },
    { name: 'Urgent', color: 'bg-orange-500' },
  ];

  const teamMembers = [
    { name: 'John Doe', avatar: '' },
    { name: 'Jane Smith', avatar: '' },
    { name: 'Bob Wilson', avatar: '' },
    { name: 'Alice Johnson', avatar: '' },
  ];

  const toggleChecklistItem = (itemId: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([
        ...checklistItems,
        {
          id: Date.now().toString(),
          text: newChecklistItem,
          completed: false,
        },
      ]);
      setNewChecklistItem('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start gap-3">
              <AlignLeft className="w-6 h-6 text-slate-600 mt-1" />
              <div className="flex-1">
                <DialogTitle className="text-slate-900 mb-2">
                  <input
                    type="text"
                    value={editedTask.title}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, title: e.target.value })
                    }
                    className="w-full bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                  />
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  in list To Do
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Labels */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-slate-600" />
                    <h3 className="text-slate-900">Labels</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedTask.labels.map((label, index) => (
                      <Badge
                        key={index}
                        className={`${label.color} text-white border-0`}
                      >
                        {label.name}
                        <button
                          className="ml-2 hover:bg-white/20 rounded"
                          onClick={() => {
                            setEditedTask({
                              ...editedTask,
                              labels: editedTask.labels.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add label
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="space-y-2">
                          {availableLabels.map((label, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                if (
                                  !editedTask.labels.find(
                                    (l) => l.name === label.name
                                  )
                                ) {
                                  setEditedTask({
                                    ...editedTask,
                                    labels: [...editedTask.labels, label],
                                  });
                                }
                              }}
                              className={`w-full px-3 py-2 rounded text-white ${label.color} hover:opacity-90 text-left`}
                            >
                              {label.name}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlignLeft className="w-5 h-5 text-slate-600" />
                    <h3 className="text-slate-900">Description</h3>
                  </div>
                  <Textarea
                    placeholder="Add a more detailed description..."
                    value={editedTask.description || ''}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        description: e.target.value,
                      })
                    }
                    className="min-h-[100px]"
                  />
                </div>

                {/* Checklist */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-5 h-5 text-slate-600" />
                    <h3 className="text-slate-900">Checklist</h3>
                    <span className="text-slate-500">
                      {completedItems}/{totalItems}
                    </span>
                  </div>
                  <Progress value={progress} className="mb-4" />
                  <div className="space-y-2 mb-3">
                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-slate-50"
                      >
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => toggleChecklistItem(item.id)}
                        />
                        <span
                          className={`flex-1 ${
                            item.completed
                              ? 'line-through text-slate-500'
                              : 'text-slate-700'
                          }`}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addChecklistItem();
                        }
                      }}
                    />
                    <Button
                      onClick={addChecklistItem}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-5 h-5 text-slate-600" />
                    <h3 className="text-slate-900">Attachments</h3>
                  </div>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add attachment
                  </Button>
                </div>

                {/* Activity & Comments */}
                <div>
                  <Tabs defaultValue="comments" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>
                    <TabsContent value="comments" className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback className="bg-blue-600 text-white">
                              {comment.author
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-slate-900">
                                {comment.author}
                              </span>
                              <span className="text-slate-500">
                                {comment.timestamp}
                              </span>
                            </div>
                            <p className="text-slate-700 bg-slate-50 rounded-lg p-3">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-600 text-white">
                            JD
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <Button
                            size="icon"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="activity" className="space-y-3">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            {activity.user
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-700">
                              <span className="text-slate-900">
                                {activity.user}
                              </span>{' '}
                              {activity.action}
                            </p>
                            <p className="text-slate-500">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-slate-900 mb-3">Add to card</h4>
                  <div className="space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <User className="w-4 h-4 mr-2" />
                          Members
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="space-y-2">
                          {teamMembers.map((member, index) => (
                            <button
                              key={index}
                              className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-100"
                              onClick={() => {
                                if (
                                  !editedTask.assignees.find(
                                    (a) => a.name === member.name
                                  )
                                ) {
                                  setEditedTask({
                                    ...editedTask,
                                    assignees: [
                                      ...editedTask.assignees,
                                      member,
                                    ],
                                  });
                                }
                              }}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="bg-slate-200 text-slate-700">
                                  {member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-slate-900">
                                {member.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="w-4 h-4 mr-2" />
                          Due date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={
                            editedTask.dueDate
                              ? new Date(editedTask.dueDate)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              setEditedTask({
                                ...editedTask,
                                dueDate: date.toISOString(),
                              });
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button variant="outline" className="w-full justify-start">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attachment
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-slate-900 mb-3">Assigned to</h4>
                  <div className="space-y-2">
                    {editedTask.assignees.map((assignee, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={assignee.avatar} />
                            <AvatarFallback className="bg-slate-200 text-slate-700">
                              {assignee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-slate-900">{assignee.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditedTask({
                              ...editedTask,
                              assignees: editedTask.assignees.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                onUpdate(editedTask);
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
