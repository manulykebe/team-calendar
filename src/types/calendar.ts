export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  attendees: string[];
}

export type ViewMode = 'month' | 'week' | 'day';