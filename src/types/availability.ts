export interface ScheduleData {
  weeklySchedule: WeeklySchedule;
  alternateWeekSchedule?: WeeklySchedule;
  startDate: string;
  endDate: string;
  repeatPattern: "all" | "evenodd";
}

export interface TimeSlot {
  am: boolean;
  pm: boolean;
}

export type WeekDays =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export interface WeeklySchedule {
  Monday: TimeSlot;
  Tuesday: TimeSlot;
  Wednesday: TimeSlot;
  Thursday: TimeSlot;
  Friday: TimeSlot;
  Saturday?: TimeSlot;
  Sunday?: TimeSlot;
}

export interface AvailabilitySettings {
  weeklySchedule: WeeklySchedule;
  startDate: string;
  endDate: string;
  repeatPattern?: "all" | "even" | "odd";
}

export interface ColleagueAvailability {
  userId: string;
  settings: AvailabilitySettings;
}
