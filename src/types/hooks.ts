import { User, Event } from "./";

export interface UseCalendarEventsReturn {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  createNewEvent: (eventData: {
    title: string;
    description: string;
    date: string;
  }) => Promise<Event>;
}

export interface UseColleagueSettingsReturn {
  colleagues: User[];
  currentUser: User | null;
  loading: boolean;
  error: string;
  updateSettings: (
    colleagueId: string,
    updates: { color?: string; initials?: string },
  ) => Promise<void>;
  getColleagueSettings: (colleagueId: string) => {
    color: string;
    initials: string;
  };
  DEFAULT_COLORS: string[];
  refresh: () => Promise<void>;
}
