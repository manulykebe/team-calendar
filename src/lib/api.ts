const API_URL = 'http://localhost:3000/api';

export async function login(email: string, password: string, site: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, site })
  });
  
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

export async function register(userData: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  site: string;
}) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
}

export async function getEvents(token: string) {
  const response = await fetch(`${API_URL}/events`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

export async function createEvent(token: string, eventData: {
  title: string;
  description: string;
  date: string;
}) {
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

export async function updateEvent(token: string, eventId: string, eventData: {
  title: string;
  description: string;
  date: string;
}) {
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