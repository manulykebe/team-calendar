import { Period } from '../types/period';
import { parseISO, isWithinInterval } from 'date-fns';

export interface DayCellSelectability {
  isSelectable: boolean;
  allowedEventType: 'requestedLeave' | 'requestedDesiderata' | null;
  editingStatus: 'closed' | 'open-holiday' | 'open-desiderata' | 'undefined';
  period: Period | null;
}

/**
 * Determines if a day cell is selectable and what event type is allowed
 * based on the admin-defined periods.
 *
 * Business Rules:
 * - If date falls outside all periods OR in a "closed" period: NOT selectable
 * - If date falls in "open-holiday" period: selectable, only "requestedLeave" allowed
 * - If date falls in "open-desiderata" period: selectable, only "requestedDesiderata" allowed
 *
 * @param date - The date to check (Date object or ISO string)
 * @param periods - Array of period configurations
 * @returns DayCellSelectability object with selectability status and allowed event type
 */
export function getDayCellSelectability(
  date: Date | string,
  periods: Period[]
): DayCellSelectability {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  // Find the period that contains this date
  const activePeriod = periods.find(period => {
    const periodStart = parseISO(period.startDate);
    const periodEnd = parseISO(period.endDate);

    return isWithinInterval(dateObj, {
      start: periodStart,
      end: periodEnd
    });
  });

  // Case 1: No period found for this date (undefined period)
  if (!activePeriod) {
    return {
      isSelectable: false,
      allowedEventType: null,
      editingStatus: 'undefined',
      period: null
    };
  }

  // Case 2: Period is closed
  if (activePeriod.editingStatus === 'closed') {
    return {
      isSelectable: false,
      allowedEventType: null,
      editingStatus: 'closed',
      period: activePeriod
    };
  }

  // Case 3: Period is open for holiday (verlof)
  if (activePeriod.editingStatus === 'open-holiday') {
    return {
      isSelectable: true,
      allowedEventType: 'requestedLeave',
      editingStatus: 'open-holiday',
      period: activePeriod
    };
  }

  // Case 4: Period is open for desiderata
  if (activePeriod.editingStatus === 'open-desiderata') {
    return {
      isSelectable: true,
      allowedEventType: 'requestedDesiderata',
      editingStatus: 'open-desiderata',
      period: activePeriod
    };
  }

  // Default fallback (should never reach here with proper typing)
  return {
    isSelectable: false,
    allowedEventType: null,
    editingStatus: 'closed',
    period: activePeriod
  };
}

/**
 * Checks if a specific event type is allowed for a given date
 *
 * @param date - The date to check
 * @param eventType - The event type to validate
 * @param periods - Array of period configurations
 * @returns true if the event type is allowed, false otherwise
 */
export function isEventTypeAllowed(
  date: Date | string,
  eventType: string,
  periods: Period[]
): boolean {
  const selectability = getDayCellSelectability(date, periods);

  if (!selectability.isSelectable) {
    return false;
  }

  return selectability.allowedEventType === eventType;
}

/**
 * Gets the allowed event type for a date range
 * Returns null if the range spans multiple periods with different editing statuses,
 * or if any date in the range is not selectable
 *
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @param periods - Array of period configurations
 * @returns The allowed event type if consistent across the range, null otherwise
 */
export function getAllowedEventTypeForRange(
  startDate: Date | string,
  endDate: Date | string,
  periods: Period[]
): 'requestedLeave' | 'requestedDesiderata' | null {
  const startDateObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  // Check each date in the range
  const currentDate = new Date(startDateObj);
  let allowedEventType: 'requestedLeave' | 'requestedDesiderata' | null = null;

  while (currentDate <= endDateObj) {
    const selectability = getDayCellSelectability(currentDate, periods);

    // If any date is not selectable, the entire range is invalid
    if (!selectability.isSelectable) {
      return null;
    }

    // First date sets the allowed event type
    if (allowedEventType === null) {
      allowedEventType = selectability.allowedEventType;
    }
    // If event types differ across the range, return null
    else if (allowedEventType !== selectability.allowedEventType) {
      return null;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return allowedEventType;
}
