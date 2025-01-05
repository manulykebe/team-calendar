import { login, register } from './auth';
import { getEvents, createEvent, updateEvent, deleteEvent } from './events';
import { getUsers, createUser, updateUser, deleteUser } from './users';

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