// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { DashboardView } from './components/dashboard-view';
import { ForgotPasswordPage } from './components/forgot-password-page';
import { LoginPage } from './components/login-page';
import { MainLayout } from './components/main-layout';
import { MyWorkView } from './components/my-work-view';
import { ProjectView } from './components/project-view';
import { SignUpPage } from './components/signup-page';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/auth-context';
import { SocketProvider } from './context/socket-context';
import { queryClient } from './lib/query-client';
type AuthPage = 'login' | 'signup' | 'forgot-password';
type AppView = 'dashboard' | 'board' | 'my-work';

// Tách MainApp ra để dùng được hook useAuth
function MainApp() {
  const { isAuthenticated, logout } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>('');

  // ... logic xử lý view giữ nguyên ...
  const handleNavigate = (view: string) => {
    if (view === 'dashboard' || view === 'my-work') {
      setCurrentView(view as AppView);
      setCurrentProjectId(null);
    }
  };

  const handleOpenProject = (projectId: string, projectTitle: string) => { // Update signature
    setCurrentProjectId(projectId);
    setCurrentProjectTitle(projectTitle);
    setCurrentView('board');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentProjectId(null);
  };

  // Render logic
  if (!isAuthenticated) {
    if (authPage === 'login') return <LoginPage onNavigate={(page) => setAuthPage(page as AuthPage)} />;
    if (authPage === 'signup') return <SignUpPage onNavigate={(page) => setAuthPage(page as AuthPage)} />;
    if (authPage === 'forgot-password') return <ForgotPasswordPage onNavigate={(page) => setAuthPage(page as AuthPage)} />;
  }

  return (
    <MainLayout 
      currentView={currentView} 
      onNavigate={handleNavigate} 
      onLogout={logout}
      onOpenProject={handleOpenProject}
    >
      {currentView === 'dashboard' && <DashboardView onOpenProject={handleOpenProject} />}
      {currentView === 'my-work' && <MyWorkView onNavigateToProject={handleOpenProject} />}
      {currentView === 'board' && currentProjectId && (
        <ProjectView projectId={currentProjectId} projectTitle={currentProjectTitle} onBack={handleBackToDashboard} />
      )}
    </MainLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <MainApp />
          <Toaster />
        </SocketProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}