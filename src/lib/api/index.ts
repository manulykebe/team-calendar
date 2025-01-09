import { login, register } from './auth';
import { getEvents, createEvent, updateEvent, deleteEvent } from './events';
import { getUsers, createUser, updateUser, deleteUser } from './users';
import { API_URL } from './config';

export async function getSiteData(site: string) {
  const response = await fetch(`${API_URL}/sites/${site}`);
  if (!response.ok) {
    throw new Error('Failed to fetch site data');
  }
  return response.json();
}

export {
  // Auth
  login,
  register,
  
  // Events
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  
  // Users
  getUsers,
  createUser,
  updateUser,
  deleteUser
};