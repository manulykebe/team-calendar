import { useState } from "react";
import { Event } from "../types/event";
import { updateEvent } from "../lib/api/events";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useEventOperations } from "./useEventOperations";

export function useCalendarState() {
  const { token } = useAuth();
  const { events, refreshData } = useApp();
  const { createEventWithUndo, updateEventWithUndo, deleteEventWithUndo } = useEventOperations();
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
    endDate?: string;
    type: string;
    userId?: string;
    amSelected?: boolean;
    pmSelected?: boolean;
  }) => {
    if (!token) return;

    try {
      await createEventWithUndo(eventData);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to create event:", error);
      throw error;
    }
  };

  const handleEventDelete = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      try {
        await deleteEventWithUndo(event);
      } catch (error) {
        console.error("Failed to delete event:", error);
        throw error;
      }
    }
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
      const originalEvent = { ...event };
      const newEventData = {
        date: newDate,
        endDate: newEndDate,
      };
      
      await updateEventWithUndo(eventId, newEventData, originalEvent);
    } catch (error) {
      console.error("Failed to resize event:", error);
    }
  };

  const handleDateClick = (date: Date) => {
    if (!selectedStartDate) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (!selectedEndDate) {
      if (date < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
      setShowModal(true);
      setHoverDate(null);
    } else {
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
    handleCreateEvent,
    handleEventDelete,
    handleEventResize,
    setSelectedStartDate,
    setSelectedEndDate,
  };
}