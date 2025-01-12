// Core state types
export interface AppState {
  calendar: CalendarState;
  users: UsersState;
  settings: SettingsState;
}

export interface CalendarState {
  events: Event[];
  selectedDate: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface UsersState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface SettingsState {
  theme: "light" | "dark" | "system";
  showWeekends: boolean;
  weekStartsOnMonday: boolean;
}
