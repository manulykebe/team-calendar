import { useState } from 'react';
import { Event } from '../types/event';
import { getEvents, createEvent, updateEvent } from '../lib/api';
import { format } from 'date-fns';

export function useCalendarState(token: string | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    if (!token) return;
    try {
      const eventsData = await getEvents(token);
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const handleCreateEvent = async (eventData: { title: string; description: string }) => {
    if (!token) return;

    try {
      const newEvent = await createEvent(token, {
        ...eventData,
        date: format(selectedDate, "yyyy-MM-dd"),
      });
      setEvents([...events, newEvent]);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const handleEventMove = async (eventId: string, newDate: string) => {
    if (!token) return;

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      const updatedEvent = await updateEvent(token, eventId, {
        ...event,
        date: newDate
      });
      setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
    } catch (error) {
      console.error('Failed to move event:', error);
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
    handleEventMove
  };
}