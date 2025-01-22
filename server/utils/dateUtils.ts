/**
 * Calculate the ISO week number for a given date
 * @param date The date to get the week number for
 * @returns The ISO week number (1-53)
 *
 * src\utils\dateUtils.ts
 *
 */
import { getWeek } from "date-fns";
export function getWeekNumber(date: Date): number {
	return getWeek(date, { weekStartsOn: 6 });
}


export const isMonday = (date: Date) => date.getDay() === 1; // 1 = Monday
export const isTuesday = (date: Date) => date.getDay() === 2; // 2 = Tuesday	
export const isWednesday = (date: Date) => date.getDay() === 3; // 3 = Wednesday
export const isThursday = (date: Date) => date.getDay() === 4; // 4 = Thursday
export const isFriday = (date: Date) => date.getDay() === 5; // 5 = Friday
export const isSaturday = (date: Date) => date.getDay() === 6; // 6 = Saturday
export const isSunday = (date: Date) => date.getDay() === 0; // 0 = Sunday
export const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6; // 0 = Sunday, 6 = Saturday
export const isWeekday = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6; // 0 = Sunday, 6 = Saturday
export const isLastDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() === date.getDate();
export const isFirstDayOfMonth = (date: Date) => date.getDate() === 1;


export const isStartOfWeek = (date: Date, startOfWeek: string) => {
	switch (startOfWeek) {
		case "Monday":
			return isMonday(date);
		case "Tuesday":
			return isTuesday(date);
		case "Wednesday":
			return isWednesday(date);
		case "Thursday":
			return isThursday(date);
		case "Friday":
			return isFriday(date);
		case "Saturday":
			return isSaturday(date);
		case "Sunday":
			return isSunday(date);
		default:
			throw new Error("Invalid start of week day");
	}
}; // as set in weekStartsOn on (site).json