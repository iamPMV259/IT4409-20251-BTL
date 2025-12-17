import React, { useState } from 'react';
import { LayoutGrid, Calendar, BarChart3, ArrowLeft, Star } from 'lucide-react';
import { Button } from './ui/button';
import { BoardView } from './board-view';
import { CalendarView } from './calendar-view';
import { DashboardStatsView } from './dashboard-stats-view';

interface ProjectViewProps {
  projectId: string;
  projectTitle: string;
  onBack: () => void;
}

type ProjectViewType = 'board' | 'calendar' | 'stats';

export function ProjectView({ projectId, projectTitle, onBack }: ProjectViewProps) {
  const [currentView, setCurrentView] = useState<ProjectViewType>('board');

  return (
    <div className="flex flex-col h-full">
      {/* View Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 px-4 lg:px-6 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 flex items-center gap-1">
            <Button
              variant={currentView === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('board')}
              className={`gap-2 ${
                currentView === 'board' ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Board</span>
            </Button>
            <Button
              variant={currentView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('calendar')}
              className={`gap-2 ${
                currentView === 'calendar' ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
            <Button
              variant={currentView === 'stats' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('stats')}
              className={`gap-2 ${
                currentView === 'stats' ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="hidden lg:flex">
            <Star className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'board' && (
          <BoardView
            projectId={projectId}
            projectTitle={projectTitle}
            onBack={onBack}
          />
        )}
        {currentView === 'calendar' && (
          <CalendarView
            projectId={projectId}
            projectTitle={projectTitle}
            onBack={onBack}
          />
        )}
        {currentView === 'stats' && (
          <DashboardStatsView
            projectId={projectId}
            projectTitle={projectTitle}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  );
}
