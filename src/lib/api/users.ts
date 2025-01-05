import { request } from './client';
import type { User } from '../../types';
import type { UserUpdateData } from '../../types/api';

export async function getUsers(token: string): Promise<User[]> {
  return request<User[]>('/users', { token });
}

export async function updateUser(token: string, userId: string, data: UserUpdateData): Promise<User> {
  return request<User>(`/users/${userId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export async function deleteUser(token: string, userId: string): Promise<void> {
  return request(`/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}