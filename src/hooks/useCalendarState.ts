import { useState, useCallback } from "react";
import { Event } from "../types/event";
import { getEvents, createEvent, updateEvent } from "../lib/api";
import { format } from "date-fns";

export function useCalendarState(token: string | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token) {
      console.warn("No authentication token available");
      return;
    }

    try {
      const eventsData = await getEvents(token);
      setEvents(eventsData);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to fetch events:", error.message);
      } else {
        console.error("Failed to fetch events: Unknown error");
      }
    }
  }, [token]);

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    endDate?: string;
  }) => {
    if (!token) {
      console.warn("No authentication token available");
      return;
    }

    try {
      const newEvent = await createEvent(token, {
        ...eventData,
        date: format(selectedDate, "yyyy-MM-dd"),
      });
      setEvents((prev) => [...prev, newEvent]);
      setShowModal(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to create event:", error.message);
      } else {
        console.error("Failed to create event: Unknown error");
      }
      throw error;
    }
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const handleEventMove = async (eventId: string, newDate: string) => {
    if (!token) {
      console.warn("No authentication token available");
      return;
    }

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    try {
      const updatedEvent = await updateEvent(token, eventId, {
        ...event,
        date: newDate,
      });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? updatedEvent : e)),
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to move event:", error.message);
      } else {
        console.error("Failed to move event: Unknown error");
      }
    }
  };

  const handleEventResize = async (
    eventId: string,
    newDate: string,
    newEndDate?: string,
  ) => {
    if (!token) {
      console.warn("No authentication token available");
      return;
    }

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    try {
      const updatedEvent = await updateEvent(token, eventId, {
        ...event,
        date: newDate,
        endDate: newEndDate,
      });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? updatedEvent : e)),
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to resize event:", error.message);
      } else {
        console.error("Failed to resize event: Unknown error");
      }
    }
  };

  return {
    events,
    selectedDate,
    currentMonth,
    showModal,
    selectedEvent,
    setSelectedDate,
    setCurrentMonth,
    setShowModal,
    setSelectedEvent,
    fetchEvents,
    handleCreateEvent,
    handleEventDelete,
    handleEventMove,
    handleEventResize,
  };
}
