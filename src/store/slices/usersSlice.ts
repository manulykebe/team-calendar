import { create } from 'zustand';
import { UsersState } from '../types';
import { getUsers, updateUser } from '../../lib/api';

interface UsersStore extends UsersState {
  fetchUsers: (token: string) => Promise<void>;
  updateUserSettings: (token: string, userId: string, settings: any) => Promise<void>;
  setCurrentUser: (email: string) => void;
}

export const useUsersStore = create<UsersStore>((set) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,

  fetchUsers: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const users = await getUsers(token);
      set({ users, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch users', isLoading: false });
    }
  },

  updateUserSettings: async (token, userId, settings) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await updateUser(token, userId, { settings });
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? updatedUser : u)),
        currentUser: state.currentUser?.id === userId ? updatedUser : state.currentUser,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update settings', isLoading: false });
    }
  },

  setCurrentUser: (email) => 
    set((state) => ({
      currentUser: state.users.find((u) => u.email === email) || null,
    })),
}));