import { API_URL } from './config';
import type { UserFormData } from '../../types/user';

export async function getUsers(token: string) {
  const response = await fetch(`${API_URL}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function createUser(token: string, userData: UserFormData) {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
}

export async function updateUser(token: string, userId: string, userData: Partial<UserFormData & { settings?: any }>) {
  // If only settings are being updated, send only the settings
  const isSettingsOnlyUpdate = Object.keys(userData).length === 1 && 'settings' in userData;
  
  const body = isSettingsOnlyUpdate
    ? { settings: userData.settings }
    : userData;

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) throw new Error('Failed to update user');
  return response.json();
}

export async function deleteUser(token: string, userId: string) {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to delete user');
}