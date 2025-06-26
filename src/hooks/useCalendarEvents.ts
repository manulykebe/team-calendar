import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getEvents, createEvent } from "../lib/api/events";
import type { Event } from "../types/event";

export function useCalendarEvents() {
  const { token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getEvents(token);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createNewEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
  }) => {
    if (!token) {
      throw new Error("Not authenticated");
    }

    const newEvent = await createEvent(token, eventData);
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    refreshEvents: fetchEvents,
    createNewEvent,
  };
}
