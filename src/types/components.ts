import { ReactNode } from "react";
import { User, Event } from "./";

// Common component props
export interface BaseProps {
  className?: string;
  children?: ReactNode;
}

// Calendar component types
export interface CalendarProps extends BaseProps {
  defaultDate?: Date;
}

export interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  showWeekends: boolean;
  weekStartsOnMonday: boolean;
}

export interface EventCardProps {
  event: Event;
  userSettings?: User["settings"];
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

// Modal types
export interface ModalProps extends BaseProps {
  onClose: () => void;
  title: string;
}

export interface EventModalProps extends Omit<ModalProps, "title"> {
  date: Date;
  onSubmit: (data: EventFormData) => Promise<void>;
}

export interface EventFormData {
  title: string;
  description: string;
}

// Settings component types
export interface SettingsPanelProps extends BaseProps {
  onClose?: () => void;
}

export interface ColleagueSettingsProps {
  onClose: () => void;
}

export interface ColleagueAvatarProps {
  firstName: string;
  lastName: string;
  color: string;
  abbreviation?: string;
  size?: "sm" | "md" | "lg";
}
