import { API_URL } from './config';
import type { EventData } from './types';

export async function getEvents(token: string) {
  const response = await fetch(`${API_URL}/events`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch events' }));
    throw new Error(error.message || 'Failed to fetch events');
  }
  return response.json();
}

export async function createEvent(token: string, eventData: EventData) {
  if (!eventData.title?.trim()) {
    throw new Error('Event title is required');
  }

  if (!eventData.date) {
    throw new Error('Event date is required');
  }

  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: eventData.title.trim(),
      description: eventData.description?.trim() || '',
      date: eventData.date
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create event' }));
    throw new Error(errorData.message || 'Failed to create event');
  }

  return response.json();
}