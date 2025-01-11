import { parseISO, isAfter, isBefore, addDays } from 'date-fns';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function useAvailabilityValidation() {
  const validateSchedule = (
    startDate: string,
    endDate: string,
    currentEntryIndex: number,
    totalEntries: number,
    availability: any[]
  ): ValidationResult => {
    // Basic date validation
    if (!startDate) {
      return { isValid: false, error: 'Start date is required' };
    }

    // End date is required for all schedules except the last one
    if (currentEntryIndex !== totalEntries - 1 && !endDate) {
      return { isValid: false, error: 'End date is required for all schedules except the last one' };
    }

    // If end date is provided, it must be after start date
    if (endDate && isBefore(parseISO(endDate), parseISO(startDate))) {
      return { isValid: false, error: 'End date must be after start date' };
    }

    // Check for gaps and overlaps with other schedules
    const currentStart = parseISO(startDate);
    const currentEnd = endDate ? parseISO(endDate) : null;

    // Check previous schedule
    if (currentEntryIndex > 0) {
      const prevSchedule = availability[currentEntryIndex - 1];
      const prevEnd = parseISO(prevSchedule.endDate);
      const expectedStart = addDays(prevEnd, 1);

      if (!isSameDay(currentStart, expectedStart)) {
        return { 
          isValid: false, 
          error: 'Schedule must start immediately after the previous schedule ends (no gaps allowed)' 
        };
      }
    }

    // Check next schedule
    if (currentEntryIndex < totalEntries - 1 && currentEnd) {
      const nextSchedule = availability[currentEntryIndex + 1];
      const nextStart = parseISO(nextSchedule.startDate);
      const expectedNextStart = addDays(currentEnd, 1);

      if (!isSameDay(nextStart, expectedNextStart)) {
        return { 
          isValid: false, 
          error: 'Next schedule must start immediately after this schedule ends (no gaps allowed)' 
        };
      }
    }

    return { isValid: true };
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  return {
    validateSchedule
  };
}