import React, { useState } from 'react';
import { LoginPage } from './components/login-page';
import { SignUpPage } from './components/signup-page';
import { ForgotPasswordPage } from './components/forgot-password-page';
import { MainLayout } from './components/main-layout';
import { DashboardView } from './components/dashboard-view';
import { ProjectView } from './components/project-view';
import { MyWorkView } from './components/my-work-view';
import { Toaster } from './components/ui/sonner';

type AuthPage = 'login' | 'signup' | 'forgot-password';
type AppView = 'dashboard' | 'board' | 'my-work' | 'settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>('');

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleSignUp = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthPage('login');
    setCurrentView('dashboard');
  };

  const handleOpenProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    // Mock project titles
    const projectTitles: { [key: string]: string } = {
      '1': 'Website Redesign',
      '2': 'Mobile App Development',
      '3': 'Marketing Campaign',
      '4': 'Product Launch Q4',
    };
    setCurrentProjectTitle(projectTitles[projectId] || 'Project');
    setCurrentView('board');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentProjectId(null);
  };

  const handleNavigate = (view: string) => {
    if (view === 'dashboard' || view === 'my-work' || view === 'settings') {
      setCurrentView(view as AppView);
      setCurrentProjectId(null);
    }
  };

  // Authentication screens
  if (!isAuthenticated) {
    if (authPage === 'login') {
      return (
        <>
          <LoginPage
            onLogin={handleLogin}
            onNavigate={(page) => setAuthPage(page as AuthPage)}
          />
          <Toaster />
        </>
      );
    }

    if (authPage === 'signup') {
      return (
        <>
          <SignUpPage
            onSignUp={handleSignUp}
            onNavigate={(page) => setAuthPage(page as AuthPage)}
          />
          <Toaster />
        </>
      );
    }

    if (authPage === 'forgot-password') {
      return (
        <>
          <ForgotPasswordPage
            onNavigate={(page) => setAuthPage(page as AuthPage)}
          />
          <Toaster />
        </>
      );
    }
  }

  // Main application
  return (
    <>
      <MainLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {currentView === 'dashboard' && (
          <DashboardView onOpenProject={handleOpenProject} />
        )}

        {currentView === 'my-work' && (
          <MyWorkView />
        )}

        {currentView === 'board' && currentProjectId && (
          <ProjectView
            projectId={currentProjectId}
            projectTitle={currentProjectTitle}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === 'settings' && (
          <div className="p-6 lg:p-8 max-w-4xl mx-auto">
            <h1 className="text-slate-900 mb-6">Settings</h1>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-slate-900 mb-4">Account Settings</h2>
              <p className="text-slate-600">
                Settings page coming soon. Here you will be able to manage your
                account preferences, notifications, and team settings.
              </p>
            </div>
          </div>
        )}
      </MainLayout>
      <Toaster />
    </>
  );
}
