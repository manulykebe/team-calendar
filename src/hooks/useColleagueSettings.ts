import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, updateUser } from '../lib/api';
import { User } from '../types/user';
import { EventEmitter } from '../utils/eventEmitter';

// Create an event emitter for user settings updates
export const userSettingsEmitter = new EventEmitter();

export const DEFAULT_COLORS = [
  '#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090',
  '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'
];

export function useColleagueSettings() {
  const { token } = useAuth();
  const [colleagues, setColleagues] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const users = await getUsers(token);
      const userEmail = localStorage.getItem('userEmail');
      const current = users.find(u => u.email === userEmail);
      
      if (current) {
        setCurrentUser(current);
        setColleagues([current, ...users.filter(u => u.id !== current.id)]);
      } else {
        throw new Error('Current user not found');
      }
    } catch (err) {
      setError('Failed to load colleagues');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSettings = async (colleagueId: string, updates: {
    color?: string;
    abbrev?: string;
  }) => {
    if (!currentUser || !token) return;

    const newSettings = {
      ...currentUser.settings,
      colleagues: {
        ...currentUser.settings?.colleagues,
        [colleagueId]: {
          ...currentUser.settings?.colleagues?.[colleagueId],
          ...updates
        }
      }
    };

    try {
      await updateUser(token, currentUser.id, { settings: newSettings });
      setCurrentUser(prev => prev ? { ...prev, settings: newSettings } : null);
      
      // Emit event to notify other components
      userSettingsEmitter.emit('settingsUpdated', { userId: currentUser.id, settings: newSettings });
      
    } catch (err) {
      setError('Failed to update settings');
      throw err;
    }
  };

  const getColleagueSettings = (colleagueId: string) => {
    return (
      currentUser?.settings?.colleagues?.[colleagueId] || {
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        abbrev: ''
      }
    );
  };

  return {
    colleagues,
    currentUser,
    loading,
    error,
    updateSettings,
    getColleagueSettings,
    DEFAULT_COLORS,
    refresh: fetchData
  };
}