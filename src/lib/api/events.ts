import { request } from './client';
import type { Event } from '../../types';
import type { EventCreateData, EventUpdateData } from '../../types/api';

export async function getEvents(token: string): Promise<Event[]> {
  return request<Event[]>('/events', { token });
}

export async function createEvent(token: string, data: EventCreateData): Promise<Event> {
  return request<Event>('/events', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export async function updateEvent(token: string, id: string, data: EventUpdateData): Promise<Event> {
  return request<Event>(`/events/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(token: string, id: string): Promise<void> {
  return request(`/events/${id}`, {
    method: 'DELETE',
    token,
  });
}