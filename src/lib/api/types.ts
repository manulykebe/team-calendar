export interface EventData {
	title: string;
	description: string;
	date: string;
}

export interface AuthResponse {
	token: string;
}

export interface RegisterData {
	firstName: string;
	lastName: string;
	email: string;
	mobile: string;
	password: string;
	site: string;
}

export interface UserSettings {
	settings: Settings;
}

export interface Settings {
	app: AppSettings;
	colleagues: Record<ColleagueID, ColleagueCalendarSettings>;
	colleagueOrder: ColleagueID[];
	showWeekNumber: string;
	availability: Availability[];
	availabilityExceptions: AvailabilityException[]; // or you can replace with an appropriate type if known
}

export interface AppSettings {
	color: {
		[key: string]: string;
		// For example, "Tuesday": "#4575b4"
		// If you know exactly which days can appear, you could enumerate them instead of using an index signature.
	};
}

export type ColleagueID = string;
export interface ColleagueCalendarSettings {
	color?: string;
	initials?: string;
	visible?: boolean;
}

export interface Availability {
	weeklySchedule: WeeklySchedule;
	alternateWeeklySchedule?: WeeklySchedule;
	startDate: string;
	endDate: string;
	repeatPattern: string;
}
export type WeekDays =
	| "Monday"
	| "Tuesday"
	| "Wednesday"
	| "Thursday"
	| "Friday";
export type WeeklySchedule = {
	[key in WeekDays]?: DailyAvailability;
};
export type DayPartsOptions = ["am" | "pm", "day"];
export type DayParts = "am" | "pm";
export type DailyAvailability = {
	[key in DayParts]?: boolean;
};

export interface AvailabilityException {}
