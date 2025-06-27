import { format, parseISO, isValid } from "date-fns";
import { Holiday } from "../lib/api/holidays";

/**
 * Checks if a given date is a public holiday
 * 
 * @param date - Date object or ISO string to check
 * @param holidays - Map of holidays with date strings as keys
 * @returns boolean - true if the date is a public holiday, false otherwise
 */
export function isPublicHoliday(
  date: Date | string,
  holidays?: Map<string, Holiday> | Holiday[]
): boolean {
  if (!holidays || (holidays instanceof Map && holidays.size === 0) || (Array.isArray(holidays) && holidays.length === 0)) {
    return false;
  }

  try {
    // Normalize the date to a string format
    let dateStr: string;
    
    if (typeof date === 'string') {
      // Validate the string date
      const parsedDate = parseISO(date);
      if (!isValid(parsedDate)) {
        return false;
      }
      dateStr = format(parsedDate, 'yyyy-MM-dd');
    } else if (date instanceof Date) {
      // Validate the Date object
      if (!isValid(date)) {
        return false;
      }
      dateStr = format(date, 'yyyy-MM-dd');
    } else {
      return false;
    }

    // Check if the date is in the holidays map or array
    if (holidays instanceof Map) {
      return holidays.has(dateStr);
    } else if (Array.isArray(holidays)) {
      return holidays.some(holiday => holiday.date === dateStr);
    }

    return false;
  } catch (error) {
    console.warn('Error checking if date is a public holiday:', error);
    return false;
  }
}