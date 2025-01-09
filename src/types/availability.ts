import { User } from './user';

export interface TimeSlot {
  am: boolean;
  pm: boolean;
}

export interface WeeklySchedule {
  Monday: TimeSlot;
  Tuesday: TimeSlot;
  Wednesday: TimeSlot;
  Thursday: TimeSlot;
  Friday: TimeSlot;
  Saturday: TimeSlot;
  Sunday: TimeSlot;
}

export interface AvailabilitySettings {
  weeklySchedule: WeeklySchedule;
  startDate: string;
  endDate: string;
  repeatPattern?: 'all' | 'even' | 'odd';
}

export interface ColleagueAvailability {
  userId: string;
  settings: AvailabilitySettings;
}