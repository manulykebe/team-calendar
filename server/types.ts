import { Request } from 'express';

export interface AuthRequest extends Request {
	user?: {
		id: string;
		email: string;
		site: string;
		role?: string;
	  };
}
export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	mobile: string;
	password: string;
	site: string;
	role: "admin" | "user";
	createdAt: string;
	updatedAt: string;
}

export type ColleagueID = string;
export interface ColleagueCalendarSettings {
	color?: string;
	initials?: string;
	visible?: boolean;
}

export type DayParts = "am" | "pm";
export type DailyAvailability = {
	[key in DayParts]?: boolean;
};

export type WeekDays =
	| "Monday"
	| "Tuesday"
	| "Wednesday"
	| "Thursday"
	| "Friday"
	| "Saturday"
	| "Sunday";
export type WeeklySchedule = {
	[key in WeekDays]?: DailyAvailability;
};

export interface Availability {
	weeklySchedule: WeeklySchedule;
	oddWeeklySchedule?: WeeklySchedule;
	startDate: string;
	endDate?: string;
	repeatPattern: string;
}

export interface AvailabilityExceptions {
  date: string;
  am?: boolean;
  pm?: boolean;
}

export interface UserSettings {
	colleagues: Record<ColleagueID, ColleagueCalendarSettings>;
	showWeekNumber: "left" | "tight" | "none";
	colleagueOrder: string[];
	availability: Availability[];
	availabilityExceptions: AvailabilityExceptions[];
}

export interface Event {
	type: string;
	id: string;
	userId: string;
	title: string;
	description: string;
	date: string;
	endDate?: string;
	createdAt: string;
	updatedAt: string;
}
