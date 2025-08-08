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
    userId?: string; // Allow specifying which user's event to create
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
    title?: string;
    description?: string;
    date?: string;
    endDate?: string;
    type?: string;
    status?: 'pending' | 'approved' | 'denied';
    userId?: string; // Allow admin to specify which user's event to update
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

export async function updateEventStatus(
  token: string,
  eventId: string,
  status: 'pending' | 'approved' | 'denied',
  userId?: string
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const body: any = { status };
  if (userId) {
    body.userId = userId;
  }

  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update event status" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function bulkUpdateEventStatus(
  token: string,
  eventIds: string[],
  status: 'pending' | 'approved' | 'denied'
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/events/bulk-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventIds, status }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to bulk update event status" }));
    throw new Error(error.message);
  }
  return response.json();
}

export async function deleteEvent(token: string, eventId: string, ownerUserId?: string) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const body = ownerUserId ? JSON.stringify({ userId: ownerUserId }) : undefined;

  try {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: "DELETE",
      headers,
      body,
    });

    // If event is not found (404), treat as success since it's already gone
    if (response.status === 404) {
      return;
    }

    if (!response.ok) {
      let errorMessage = "Failed to delete event";
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // do nothing, keep default error message
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}