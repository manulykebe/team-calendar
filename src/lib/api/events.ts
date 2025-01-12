import { API_URL } from "./config";

export async function getEvents(token: string) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch events" }));
    throw new Error(error.message);
  }
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
  },
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create event" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function updateEvent(
  token: string,
  eventId: string,
  eventData: {
    title: string;
    description: string;
    date: string;
    endDate?: string;
    type: string;
  },
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update event" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function deleteEvent(token: string, eventId: string) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to delete event" }));
    throw new Error(error.message);
  }
}
