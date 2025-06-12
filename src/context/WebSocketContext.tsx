import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  isConnected: () => boolean;
  joinCalendarDate: (date: string) => void;
  leaveCalendarDate: (date: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: () => false,
  joinCalendarDate: () => {},
  leaveCalendarDate: () => {},
});

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { token } = useAuth();
  const { refreshData, currentUser } = useApp();
  const { on, off, isConnected, joinCalendarDate, leaveCalendarDate } = useWebSocket();

  useEffect(() => {
    if (!token || !currentUser) return;

    // Handle event changes - use background refresh to avoid view reset
    const handleEventChange = (data: {
      action: 'created' | 'updated' | 'deleted';
      event: any;
      timestamp: string;
    }) => {
      console.log('📅 Event changed:', data);
      
      // Show notification
      const actionText = data.action === 'created' ? 'created' : 
                        data.action === 'updated' ? 'updated' : 'deleted';
      
      // toast.success(`Event ${actionText} by colleague`, {
      //   duration: 3000,
      //   icon: '📅'
      // });  

      // Use background refresh that doesn't affect calendar view
      refreshData();
    };

    // Handle availability changes - use background refresh
    const handleAvailabilityChange = (data: {
      userId: string;
      availability: any;
      timestamp: string;
    }) => {
      console.log('⏰ Availability changed:', data);
      
      // Only show notification if it's not the current user
      if (data.userId !== currentUser.id) {
        toast.success('Colleague updated their availability', {
          duration: 3000,
          icon: '⏰'
        });

        // Use background refresh that doesn't affect calendar view
        refreshData();
      }
    };

    // Handle user settings changes - use background refresh
    const handleUserSettingsChange = (data: {
      userId: string;
      settings: any;
      timestamp: string;
    }) => {
      console.log('⚙️ User settings changed:', data);
      
      // Only refresh if it affects the current user's view
      if (data.userId !== currentUser.id) {
        // Use background refresh that doesn't affect calendar view
        refreshData();
      }
    };

    // Handle user connection status
    const handleUserConnected = (data: { userId: string; email: string }) => {
      console.log('🟢 User connected:', data);
      // Could show a subtle notification or update UI to show online status
    };

    const handleUserDisconnected = (data: { userId: string; email: string }) => {
      console.log('🔴 User disconnected:', data);
      // Could update UI to show offline status
    };

    // Handle notifications
    const handleNotification = (data: any) => {
      console.log('🔔 Notification received:', data);
      
      if (data.type === 'info') {
        toast.success(data.message, { duration: 4000 });
      } else if (data.type === 'warning') {
        toast.error(data.message, { duration: 5000 });
      }
    };

    // Register event listeners
    on('event:changed', handleEventChange);
    on('availability:changed', handleAvailabilityChange);
    on('user:settings:changed', handleUserSettingsChange);
    on('user:connected', handleUserConnected);
    on('user:disconnected', handleUserDisconnected);
    on('notification', handleNotification);

    // Cleanup listeners on unmount
    return () => {
      off('event:changed', handleEventChange);
      off('availability:changed', handleAvailabilityChange);
      off('user:settings:changed', handleUserSettingsChange);
      off('user:connected', handleUserConnected);
      off('user:disconnected', handleUserDisconnected);
      off('notification', handleNotification);
    };
  }, [token, currentUser, on, off, refreshData]);

  const contextValue = {
    isConnected,
    joinCalendarDate,
    leaveCalendarDate,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocketContext = () => useContext(WebSocketContext);