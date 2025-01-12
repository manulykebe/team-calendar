import { parseISO, isAfter, isBefore, addDays, isValid } from "date-fns";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function useAvailabilityValidation() {
  const validateSchedule = (
    startDate: string,
    endDate: string | undefined,
    currentEntryIndex: number,
    totalEntries: number,
    availability: any[],
  ): ValidationResult => {
    // Basic date validation
    if (!startDate) {
      return { isValid: false, error: "Start date is required" };
    }

    const parsedStartDate = parseISO(startDate);
    if (!isValid(parsedStartDate)) {
      return { isValid: false, error: "Invalid start date format" };
    }

    // If end date is provided, validate it
    if (endDate) {
      const parsedEndDate = parseISO(endDate);
      if (!isValid(parsedEndDate)) {
        return { isValid: false, error: "Invalid end date format" };
      }

      if (isBefore(parsedEndDate, parsedStartDate)) {
        return { isValid: false, error: "End date must be after start date" };
      }
    }

    // End date is required for all schedules except the last one
    if (currentEntryIndex !== totalEntries - 1 && !endDate) {
      return {
        isValid: false,
        error: "End date is required for all schedules except the last one",
      };
    }

    // Check for gaps and overlaps with other schedules
    const currentEnd = endDate ? parseISO(endDate) : null;

    // Check previous schedule
    if (currentEntryIndex > 0) {
      const prevSchedule = availability[currentEntryIndex - 1];
      if (!prevSchedule.endDate) {
        return {
          isValid: false,
          error: "Previous schedule must have an end date",
        };
      }

      const prevEnd = parseISO(prevSchedule.endDate);
      if (!isValid(prevEnd)) {
        return {
          isValid: false,
          error: "Invalid end date in previous schedule",
        };
      }

      const expectedStart = addDays(prevEnd, 1);
      if (!isSameDay(parsedStartDate, expectedStart)) {
        return {
          isValid: false,
          error:
            "Schedule must start immediately after the previous schedule ends (no gaps allowed)",
        };
      }
    }

    // Check next schedule
    if (currentEntryIndex < totalEntries - 1 && currentEnd) {
      const nextSchedule = availability[currentEntryIndex + 1];
      if (!nextSchedule.startDate) {
        return {
          isValid: false,
          error: "Next schedule must have a start date",
        };
      }

      const nextStart = parseISO(nextSchedule.startDate);
      if (!isValid(nextStart)) {
        return {
          isValid: false,
          error: "Invalid start date in next schedule",
        };
      }

      const expectedNextStart = addDays(currentEnd, 1);
      if (!isSameDay(nextStart, expectedNextStart)) {
        return {
          isValid: false,
          error:
            "Next schedule must start immediately after this schedule ends (no gaps allowed)",
        };
      }
    }

    return { isValid: true };
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  return {
    validateSchedule,
  };
}
