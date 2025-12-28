import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserResponse, authApi } from '../lib/api';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserResponse) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const login = (token: string, newUser: UserResponse) => {
    localStorage.setItem('accessToken', token);
    // Clear all cached queries when logging in as new user
    queryClient.clear();
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    // Clear all cached queries when logging out
    queryClient.clear();
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
      console.error("Auth check failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

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