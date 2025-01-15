import { useState, useCallback } from "react";
import { Event } from "../types/event";
import { getEvents, createEvent, updateEvent } from "../lib/api";
import { format } from "date-fns";

export function useCalendarState(token: string | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token) return;

    try {
      const eventsData = await getEvents(token);
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }, [token]);

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
    endDate?: string;
    type: string;
  }) => {
    if (!token) return;

    try {
      const newEvent = await createEvent(token, eventData);
      setEvents((prev) => [...prev, newEvent]);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to create event:", error);
      throw error;
    }
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const handleEventResize = async (
    eventId: string,
    newDate: string,
    newEndDate?: string,
  ) => {
    if (!token) return;

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
      console.error("Failed to resize event:", error);
    }
  };

  const handleDateClick = (date: Date) => {
    if (!selectedStartDate) {
      // First click - set start date
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (!selectedEndDate) {
      // Second click - set end date and open modal
      if (date < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
      setShowModal(true);
      setHoverDate(null);
    } else {
      // Reset selection on next click
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setHoverDate(null);
    }
  };

  const handleDateHover = (date: Date | null) => {
    if (selectedStartDate && !selectedEndDate) {
      setHoverDate(date);
    }
  };

  const resetSelection = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setHoverDate(null);
  };

  return {
    events,
    selectedStartDate,
    selectedEndDate,
    hoverDate,
    currentMonth,
    showModal,
    selectedEvent,
    setCurrentMonth,
    setShowModal,
    setSelectedEvent,
    handleDateClick,
    handleDateHover,
    resetSelection,
    fetchEvents,
    handleCreateEvent,
    handleEventDelete,
    handleEventResize,
  };
}