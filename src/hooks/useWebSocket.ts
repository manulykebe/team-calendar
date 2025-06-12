import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/api/config';
import toast from 'react-hot-toast';

interface WebSocketEvents {
  'event:changed': (data: {
    action: 'created' | 'updated' | 'deleted';
    event: any;
    timestamp: string;
  }) => void;
  'availability:changed': (data: {
    userId: string;
    availability: any;
    timestamp: string;
  }) => void;
  'user:settings:changed': (data: {
    userId: string;
    settings: any;
    timestamp: string;
  }) => void;
  'user:connected': (data: {
    userId: string;
    email: string;
  }) => void;
  'user:disconnected': (data: {
    userId: string;
    email: string;
  }) => void;
  'notification': (data: any) => void;
}

export function useWebSocket() {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    const wsUrl = API_URL.replace('/api', '').replace('http', 'ws');
    
    socketRef.current = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      isConnectedRef.current = true;
      
      // Authenticate with the server
      socket.emit('authenticate', token);
      
      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
    });

    socket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated:', data);
    });

    socket.on('auth:error', (error) => {
      console.error('❌ WebSocket authentication failed:', error);
      socket.disconnect();
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      isConnectedRef.current = false;
      
      // Only show toast for unexpected disconnections
      if (reason !== 'io client disconnect') {
        toast.error('Lost connection to real-time updates', { duration: 3000 });
        
        // Attempt to reconnect after a delay
        reconnectTimeoutRef.current = setTimeout(() => {
          if (token && !socketRef.current?.connected) {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      isConnectedRef.current = false;
    });

    return socket;
  }, [token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, []);

  const on = useCallback(<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback(<K extends keyof WebSocketEvents>(
    event: K,
    handler?: WebSocketEvents[K]
  ) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinCalendarDate = useCallback((date: string) => {
    emit('calendar:join', { date });
  }, [emit]);

  const leaveCalendarDate = useCallback((date: string) => {
    emit('calendar:leave', { date });
  }, [emit]);

  const isConnected = useCallback(() => {
    return isConnectedRef.current && socketRef.current?.connected;
  }, []);

  // Connect when token is available
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    on,
    off,
    emit,
    joinCalendarDate,
    leaveCalendarDate,
    isConnected
  };
}