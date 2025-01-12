import { create } from "zustand";
import { CalendarState } from "../types";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../lib/api";

interface CalendarStore extends CalendarState {
  fetchEvents: (token: string) => Promise<void>;
  addEvent: (token: string, event: Omit<Event, "id">) => Promise<void>;
  updateEvent: (
    token: string,
    id: string,
    event: Partial<Event>,
  ) => Promise<void>;
  removeEvent: (token: string, id: string) => Promise<void>;
  setSelectedDate: (date: Date | null) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  events: [],
  selectedDate: null,
  isLoading: false,
  error: null,

  fetchEvents: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const events = await getEvents(token);
      set({ events, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch events",
        isLoading: false,
      });
    }
  },

  addEvent: async (token, event) => {
    set({ isLoading: true, error: null });
    try {
      const newEvent = await createEvent(token, event);
      set((state) => ({
        events: [...state.events, newEvent],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create event",
        isLoading: false,
      });
    }
  },

  updateEvent: async (token, id, event) => {
    set({ isLoading: true, error: null });
    try {
      const updatedEvent = await updateEvent(token, id, event);
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update event",
        isLoading: false,
      });
    }
  },

  removeEvent: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteEvent(token, id);
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete event",
        isLoading: false,
      });
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
}));
