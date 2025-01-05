import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../lib/api';
import { userSettingsEmitter } from './useColleagueSettings';

export function useCalendarSettings() {
  const { token } = useAuth();
  const [weekStartsOn, setWeekStartsOn] = useState<string>('Monday');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const users = await getUsers(token);
        const userEmail = localStorage.getItem('userEmail');
        const currentUser = users.find(u => u.email === userEmail);
        
        if (currentUser) {
          // Use user preference -> site preference -> default
          setWeekStartsOn(
            currentUser.app?.weekStartsOn || 
            currentUser.site?.app?.weekStartsOn || 
            'Monday'
          );
        }
      } catch (error) {
        console.error('Failed to fetch calendar settings:', error);
      }
    };

    fetchSettings();

    const handleSettingsUpdate = ({ 
      userId, 
      app 
    }: { 
      userId: string; 
      app?: { weekStartsOn: string } 
    }) => {
      if (app?.weekStartsOn) {
        setWeekStartsOn(app.weekStartsOn);
      }
    };

    userSettingsEmitter.on('settingsUpdated', handleSettingsUpdate);
    return () => {
      userSettingsEmitter.off('settingsUpdated', handleSettingsUpdate);
    };
  }, [token]);

  return {
    weekStartsOn
  };
}