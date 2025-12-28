// src/App.tsx
import React, { useState } from 'react';
import { LoginPage } from './components/login-page';
import { SignUpPage } from './components/signup-page';
import { ForgotPasswordPage } from './components/forgot-password-page';
import { MainLayout } from './components/main-layout';
import { DashboardView } from './components/dashboard-view';
import { ProjectView } from './components/project-view';
import { MyWorkView } from './components/my-work-view';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/auth-context'; // Import mới

type AuthPage = 'login' | 'signup' | 'forgot-password';
type AppView = 'dashboard' | 'board' | 'my-work' | 'settings';

// Tách MainApp ra để dùng được hook useAuth
function MainApp() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>('');

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // ... logic xử lý view giữ nguyên ...
  const handleNavigate = (view: string) => {
    if (view === 'dashboard' || view === 'my-work' || view === 'settings') {
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
    <MainLayout currentView={currentView} onNavigate={handleNavigate} onLogout={logout}>
      {currentView === 'dashboard' && <DashboardView onOpenProject={handleOpenProject} />}
      {currentView === 'my-work' && <MyWorkView />}
      {currentView === 'board' && currentProjectId && (
        <ProjectView projectId={currentProjectId} projectTitle={currentProjectTitle} onBack={handleBackToDashboard} />
      )}
      {/* Settings giữ nguyên */}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <Toaster />
    </AuthProvider>
  );
}