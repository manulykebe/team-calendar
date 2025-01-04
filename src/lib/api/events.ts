import { API_URL } from './config';
import type { EventData } from './types';

export async function getEvents(token: string) {
  const response = await fetch(`${API_URL}/events`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

export async function createEvent(token: string, eventData: EventData) {
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData)
  });
  
  if (!response.ok) throw new Error('Failed to create event');
  return response.json();
}

export async function updateEvent(token: string, eventId: string, eventData: EventData) {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData)
  });
  
  if (!response.ok) throw new Error('Failed to update event');
  return response.json();
}

export async function deleteEvent(token: string, eventId: string) {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to delete event');
}