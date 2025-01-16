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
