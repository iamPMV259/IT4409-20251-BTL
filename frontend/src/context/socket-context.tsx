import React, { createContext, useCallback, useContext, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAuth } from './auth-context';

interface SocketContextType {
  connectToProject: (projectId: string) => void;
  disconnect: () => void;
  lastJsonMessage: any;
  sendJsonMessage: (message: any) => void;
  connectionStatus: string;
  projectId: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Load WebSocket URL from environment variables
const WS_PROTOCOL = import.meta.env.VITE_WS_PROTOCOL || 'ws';
const HOST = import.meta.env.VITE_HOST || 'localhost';
const PORT = import.meta.env.VITE_PORT || '8345';
// Không thêm port nếu là 443 (HTTPS/WSS mặc định) hoặc 80 (HTTP/WS mặc định)
const WS_BASE_URL = (PORT === '443' || PORT === '80') 
  ? `${WS_PROTOCOL}://${HOST}/ws/projects`
  : `${WS_PROTOCOL}://${HOST}:${PORT}/ws/projects`;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  
  // Lấy token (backend hiện tại chưa check, nhưng cứ gửi để đúng chuẩn)
  const token = localStorage.getItem('accessToken');

  const {
    sendJsonMessage,
    lastJsonMessage,
    readyState,
  } = useWebSocket(socketUrl, {
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    onOpen: () => {
      console.log(`✅ WS Connected to Project: ${projectId}`);
    },
    onClose: (e) => {
       console.log('❌ WS Disconnected', e.code, e.reason);
    },
    onError: (e) => {
       console.error('⚠️ WS Error:', e);
    },
  });

  const connectToProject = useCallback((pid: string) => {
    // Nếu muốn test mà không cần login, có thể bỏ check !token
    if (!token) return; 

    setProjectId(pid);
    // URL chuẩn: ws://.../ws/projects/{id}?token={jwt}
    setSocketUrl(`${WS_BASE_URL}/${pid}?token=${token}`);
  }, [token]);

  const disconnect = useCallback(() => {
    setProjectId(null);
    setSocketUrl(null);
  }, []);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return (
    <SocketContext.Provider
      value={{
        connectToProject,
        disconnect,
        lastJsonMessage,
        sendJsonMessage,
        connectionStatus,
        projectId
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};