// src/context/auth-context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authApi } from '../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (token: string, newUser: User) => {
    localStorage.setItem('accessToken', token);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await authApi.getMe();
      setUser(data);
    } catch (error) {
      console.error("Session expired", error);
      logout(); // Token lỗi thì logout luôn
    } finally {
      setIsLoading(false);
    }
  };

  // Chạy 1 lần khi app load để kiểm tra xem user đã đăng nhập chưa
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};