import { API_URL } from "./api/config";

import { Availability } from "./api/types";


export async function login(email: string, password: string, site: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, site }),
  });

  if (!response.ok) throw new Error("Login failed");
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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) throw new Error("Registration failed");
  return response.json();
}

export async function getEvents(token: string) {
  const response = await fetch(`${API_URL}/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
}

export async function createEvent(
  token: string,
  eventData: {
    title: string;
    description: string;
    date: string;
    endDate?: string;
    type: string;
    userId?: string; // Added userId for admin event creation
  }
) {
  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) throw new Error("Failed to create event");
  return response.json();
}

export async function updateEvent(
  token: string,
  eventId: string,
  eventData: {
    title?: string;
    description?: string;
    date?: string;
    endDate?: string;
    type?: string;
    status?: 'pending' | 'approved' | 'denied';
    userId?: string; // Added userId for admin event updates
  }
) {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) throw new Error("Failed to update event");
  return response.json();
}

export async function deleteEvent(token: string, eventId: string, ownerUserId?: string) {
  const options: RequestInit = {
    method: "DELETE",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  };
  
  // Include the userId in the request body if provided
  if (ownerUserId) {
    options.body = JSON.stringify({ userId: ownerUserId });
  }
  
  const response = await fetch(`${API_URL}/events/${eventId}`, options);

  if (!response.ok) throw new Error("Failed to delete event");
}

export async function getUsers(token: string) {
  const response = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}


export async function updateUser(
  token: string,
  userId: string,
  userData: any
) {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
}

export async function deleteUser(token: string, userId: string) {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to delete user");
}

export async function updateUserAvailabilitySchedule(
  token: string,
  userId: string,
  index: number,
  schedule: Availability,
) {
  const response = await fetch(`${API_URL}/availability/${userId}/${index}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(schedule),
  });

  if (!response.ok) {
    throw new Error("Failed to update availability");
  }
  return response.json();
}

export async function addUserAvailabilitySchedule(
  token: string,
  userId: string,
  index: number,
  schedule: Availability,
) {
  const response = await fetch(`${API_URL}/availability/${userId}/${index}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(schedule),
  });

  if (!response.ok) {
    throw new Error("Failed to update availability");
  }
  return response.json();
}