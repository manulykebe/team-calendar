import { parseISO, getDay, addDays, subDays, isSameDay, startOfDay, isWithinInterval } from 'date-fns';
import { Period } from '../types/period';
import { Holiday } from '../lib/api/holidays';

export interface DesiderataAvailability {
  availableWorkingDays: number;
  availableWeekendDays: number;
  totalAvailableDays: number;
  publicHolidays: Holiday[];
  rawWorkingDays: number;
  rawWeekendDays: number;
  totalWeekends?: number;
  weekendsWithHolidays?: number;
  netWeekends?: number;
  netWorkingDays?: number;
}

export interface PriorityLimits {
  maxWorkingDays: number;
  maxWeekendDays: number;
  priority: number;
}

export interface DesiderataSelection {
  workingDaysUsed: number;
  weekendDaysUsed: number;
  totalDaysUsed: number;
}

export interface MandatoryWeekendExtension {
  required: boolean;
  reason?: string;
  extendedStartDate?: Date;
  extendedEndDate?: Date;
}

/**
 * Determines if a date is a working day (Monday-Thursday)
 */
export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = getDay(date);
  return dayOfWeek >= 1 && dayOfWeek <= 4;
}

/**
 * Determines if a date is a weekend day (Friday-Sunday)
 */
export function isWeekendDay(date: Date): boolean {
  const dayOfWeek = getDay(date);
  return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
}

/**
 * Checks if a date is a public holiday
 */
export function isPublicHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.date === dateStr);
}

/**
 * Gets the day of week for a date (0=Sunday, 1=Monday, etc.)
 */
export function getDayOfWeek(date: Date): number {
  return getDay(date);
}

/**
 * STEP 1 & 2: Calculate base availability and apply public holiday adjustments
 *
 * Rules:
 * - Monday or Wednesday holiday: -1 working day, -1 weekend day
 * - Tuesday or Thursday holiday: -2 working days, -1 weekend day
 * - Friday, Saturday, or Sunday holiday: -0 working days, -1 weekend day
 */
export function calculatePeriodAvailability(
  period: Period,
  holidays: Holiday[]
): DesiderataAvailability {
  const start = parseISO(period.startDate);
  const end = parseISO(period.endDate);

  let rawWorkingDays = 0;
  let rawWeekendDays = 0;
  const publicHolidaysInPeriod: Holiday[] = [];

  // STEP 1: Count base days
  let currentDate = new Date(start);
  while (currentDate <= end) {
    const isHoliday = isPublicHoliday(currentDate, holidays);

    if (isHoliday) {
      const holidayData = holidays.find(h => h.date === currentDate.toISOString().split('T')[0]);
      if (holidayData) {
        publicHolidaysInPeriod.push(holidayData);
      }
    }

    if (isWorkingDay(currentDate)) {
      rawWorkingDays++;
    } else if (isWeekendDay(currentDate)) {
      rawWeekendDays++;
    }

    currentDate = addDays(currentDate, 1);
  }

  // STEP 2: Apply public holiday adjustments
  let workingDayAdjustment = 0;
  let weekendDayAdjustment = 0;

  for (const holiday of publicHolidaysInPeriod) {
    const holidayDate = parseISO(holiday.date);
    const dayOfWeek = getDayOfWeek(holidayDate);

    switch (dayOfWeek) {
      case 1: // Monday
        workingDayAdjustment += 1;
        weekendDayAdjustment += 1;
        break;
      case 2: // Tuesday
        workingDayAdjustment += 2;
        weekendDayAdjustment += 1;
        break;
      case 3: // Wednesday
        workingDayAdjustment += 1;
        weekendDayAdjustment += 1;
        break;
      case 4: // Thursday
        workingDayAdjustment += 2;
        weekendDayAdjustment += 1;
        break;
      case 5: // Friday
      case 6: // Saturday
      case 0: // Sunday
        weekendDayAdjustment += 1;
        break;
    }
  }

  const availableWorkingDays = Math.max(0, rawWorkingDays - workingDayAdjustment);
  const availableWeekendDays = Math.max(0, rawWeekendDays - weekendDayAdjustment);

  // Include server-side quotas if available
  const result: DesiderataAvailability = {
    availableWorkingDays,
    availableWeekendDays,
    totalAvailableDays: availableWorkingDays + availableWeekendDays,
    publicHolidays: publicHolidaysInPeriod,
    rawWorkingDays,
    rawWeekendDays,
  };

  // Add quota information from period if available
  if (period.quotas) {
    result.totalWeekends = period.quotas.totalWeekends;
    result.weekendsWithHolidays = period.quotas.weekendsWithPublicHolidays;
    result.netWeekends = period.quotas.netWeekends;
    result.netWorkingDays = period.quotas.netWorkingDays;
  }

  return result;
}

/**
 * STEP 3: Check mandatory weekend selection - Weekend Start Rule
 *
 * IF period begins on Friday OR Thursday before period is a public holiday
 * THEN entire weekend (Friday-Sunday) must be selected as unit
 */
export function checkMandatoryWeekendStart(
  period: Period,
  holidays: Holiday[]
): MandatoryWeekendExtension {
  const periodStart = parseISO(period.startDate);
  const dayOfWeek = getDayOfWeek(periodStart);

  // Check if period starts on Friday
  if (dayOfWeek === 5) {
    return {
      required: true,
      reason: 'Period starts on Friday - entire weekend must be selected',
      extendedStartDate: periodStart,
      extendedEndDate: addDays(periodStart, 2), // Friday to Sunday
    };
  }

  // Check if Thursday before period start is a public holiday
  const dayBeforePeriod = subDays(periodStart, 1);
  if (getDayOfWeek(dayBeforePeriod) === 4 && isPublicHoliday(dayBeforePeriod, holidays)) {
    return {
      required: true,
      reason: 'Thursday before period is a public holiday - entire weekend must be selected',
      extendedStartDate: periodStart,
      extendedEndDate: addDays(periodStart, Math.min(2, Math.floor((parseISO(period.endDate).getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)))),
    };
  }

  return { required: false };
}

/**
 * STEP 3: Check mandatory weekend selection - Weekend End Rule
 *
 * IF period ends on Sunday OR Monday/Tuesday after is public holiday
 * THEN entire extended period through that holiday must be selected
 */
export function checkMandatoryWeekendEnd(
  period: Period,
  holidays: Holiday[]
): MandatoryWeekendExtension {
  const periodEnd = parseISO(period.endDate);
  const dayOfWeek = getDayOfWeek(periodEnd);

  // Check if period ends on Sunday
  if (dayOfWeek === 0) {
    return {
      required: true,
      reason: 'Period ends on Sunday - entire weekend must be selected',
      extendedStartDate: subDays(periodEnd, 2), // Friday to Sunday
      extendedEndDate: periodEnd,
    };
  }

  // Check if Monday after period end is a public holiday
  const dayAfterPeriod = addDays(periodEnd, 1);
  if (getDayOfWeek(dayAfterPeriod) === 1 && isPublicHoliday(dayAfterPeriod, holidays)) {
    return {
      required: true,
      reason: 'Monday after period is a public holiday - must extend through holiday',
      extendedStartDate: periodEnd,
      extendedEndDate: dayAfterPeriod,
    };
  }

  // Check if Tuesday after period end is a public holiday
  const twoDaysAfterPeriod = addDays(periodEnd, 2);
  if (getDayOfWeek(twoDaysAfterPeriod) === 2 && isPublicHoliday(twoDaysAfterPeriod, holidays)) {
    return {
      required: true,
      reason: 'Tuesday after period is a public holiday - must extend through holiday',
      extendedStartDate: periodEnd,
      extendedEndDate: twoDaysAfterPeriod,
    };
  }

  return { required: false };
}

/**
 * STEP 5 & 6: Calculate maximum selectable days based on priority
 *
 * If server quotas are available, use them directly.
 * Otherwise fall back to calculated limits:
 * Priority 1: floor(available ÷ 4)
 * Priority 2+: floor(available ÷ 2)
 */
export function calculatePriorityLimits(
  availability: DesiderataAvailability,
  priority: number,
  period?: Period
): PriorityLimits {
  // Use server-side quotas if available
  if (period?.quotas) {
    return {
      maxWorkingDays: period.quotas.allowedWorkingDayDesiderata,
      maxWeekendDays: period.quotas.allowedWeekendDesiderata,
      priority,
    };
  }

  // Fall back to calculated limits
  const divisor = priority === 1 ? 4 : 2;

  return {
    maxWorkingDays: Math.floor(availability.availableWorkingDays / divisor),
    maxWeekendDays: Math.floor(availability.availableWeekendDays / divisor),
    priority,
  };
}

/**
 * Count days used in a selection
 */
export function countSelectionDays(
  startDate: Date,
  endDate: Date,
  holidays: Holiday[]
): DesiderataSelection {
  let workingDaysUsed = 0;
  let weekendDaysUsed = 0;

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate)) {
      workingDaysUsed++;
    } else if (isWeekendDay(currentDate)) {
      weekendDaysUsed++;
    }

    currentDate = addDays(currentDate, 1);
  }

  return {
    workingDaysUsed,
    weekendDaysUsed,
    totalDaysUsed: workingDaysUsed + weekendDaysUsed,
  };
}

/**
 * Validate a selection against priority limits
 */
export interface SelectionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  selection: DesiderataSelection;
  limits: PriorityLimits;
  remainingWorkingDays: number;
  remainingWeekendDays: number;
}

export function validateSelection(
  startDate: Date,
  endDate: Date,
  period: Period,
  holidays: Holiday[],
  priority: number,
  existingSelections: DesiderataSelection[] = []
): SelectionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Calculate availability
  const availability = calculatePeriodAvailability(period, holidays);
  const limits = calculatePriorityLimits(availability, priority, period);

  // Count current selection
  const selection = countSelectionDays(startDate, endDate, holidays);

  // Calculate total usage including existing selections
  const totalUsed = existingSelections.reduce(
    (acc, sel) => ({
      workingDaysUsed: acc.workingDaysUsed + sel.workingDaysUsed,
      weekendDaysUsed: acc.weekendDaysUsed + sel.weekendDaysUsed,
      totalDaysUsed: acc.totalDaysUsed + sel.totalDaysUsed,
    }),
    { ...selection }
  );

  // Validate working days limit
  if (totalUsed.workingDaysUsed > limits.maxWorkingDays) {
    errors.push(
      `Working days limit exceeded: ${totalUsed.workingDaysUsed}/${limits.maxWorkingDays} days`
    );
  } else if (totalUsed.workingDaysUsed === limits.maxWorkingDays) {
    warnings.push('Working days limit reached');
  }

  // Validate weekend days limit
  if (totalUsed.weekendDaysUsed > limits.maxWeekendDays) {
    errors.push(
      `Weekend days limit exceeded: ${totalUsed.weekendDaysUsed}/${limits.maxWeekendDays} days`
    );
  } else if (totalUsed.weekendDaysUsed === limits.maxWeekendDays) {
    warnings.push('Weekend days limit reached');
  }

  // Check mandatory weekend rules
  const weekendStart = checkMandatoryWeekendStart(period, holidays);
  const weekendEnd = checkMandatoryWeekendEnd(period, holidays);

  if (weekendStart.required && weekendStart.extendedStartDate && weekendStart.extendedEndDate) {
    const selectionOverlapsStart = isWithinInterval(weekendStart.extendedStartDate, {
      start: startDate,
      end: endDate,
    });
    if (selectionOverlapsStart) {
      if (
        startDate.getTime() !== weekendStart.extendedStartDate.getTime() ||
        endDate.getTime() < weekendStart.extendedEndDate.getTime()
      ) {
        errors.push(weekendStart.reason || 'Mandatory weekend selection required');
      }
    }
  }

  if (weekendEnd.required && weekendEnd.extendedStartDate && weekendEnd.extendedEndDate) {
    const selectionOverlapsEnd = isWithinInterval(weekendEnd.extendedEndDate, {
      start: startDate,
      end: endDate,
    });
    if (selectionOverlapsEnd) {
      if (
        endDate.getTime() !== weekendEnd.extendedEndDate.getTime() ||
        startDate.getTime() > weekendEnd.extendedStartDate.getTime()
      ) {
        errors.push(weekendEnd.reason || 'Mandatory weekend selection required');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    selection,
    limits,
    remainingWorkingDays: limits.maxWorkingDays - totalUsed.workingDaysUsed,
    remainingWeekendDays: limits.maxWeekendDays - totalUsed.weekendDaysUsed,
  };
}

/**
 * Check if a date needs auto-extension based on public holiday rules
 *
 * Rules:
 * 1. Friday: Always extend to Sunday
 * 2. Saturday: Extend to Friday-Sunday
 * 3. Sunday: Extend to Friday-Sunday
 * 4. Thursday: Extend to Sunday if Friday is a public holiday
 * 5. Monday: Only extend if Sunday is also a public holiday (then include Friday-Monday)
 * 6. Tuesday: Only extend if Monday is also a public holiday AND Sunday is also a holiday (then include Friday-Tuesday)
 */
function shouldAutoExtendDate(date: Date, holidays: Holiday[]): { extend: boolean; startDate?: Date; endDate?: Date; reason?: string } {
  const dayOfWeek = getDayOfWeek(date);

  // Friday: Always extend to Sunday
  if (dayOfWeek === 5) {
    return {
      extend: true,
      startDate: date,
      endDate: addDays(date, 2),
      reason: 'Selected Friday - automatically extending to Sunday',
    };
  }

  // Saturday: Extend to Friday-Sunday
  if (dayOfWeek === 6) {
    return {
      extend: true,
      startDate: subDays(date, 1), // Friday
      endDate: addDays(date, 1), // Sunday
      reason: 'Selected Saturday - automatically including full weekend (Friday-Sunday)',
    };
  }

  // Sunday: Extend to Friday-Sunday
  if (dayOfWeek === 0) {
    return {
      extend: true,
      startDate: subDays(date, 2), // Friday
      endDate: date, // Sunday
      reason: 'Selected Sunday - automatically including full weekend (Friday-Sunday)',
    };
  }

  // Thursday: Extend to Sunday if Friday is a public holiday
  if (dayOfWeek === 4) {
    const nextDay = addDays(date, 1);
    if (isPublicHoliday(nextDay, holidays)) {
      return {
        extend: true,
        startDate: date,
        endDate: addDays(date, 3),
        reason: 'Selected Thursday before bank holiday Friday - automatically extending to Sunday',
      };
    }
  }

  // Monday: Only extend if Sunday is also a public holiday
  if (dayOfWeek === 1) {
    if (isPublicHoliday(date, holidays)) {
      const sunday = subDays(date, 1);
      if (isPublicHoliday(sunday, holidays)) {
        return {
          extend: true,
          startDate: subDays(date, 3), // Friday (3 days before Monday)
          endDate: date,
          reason: 'Selected Monday holiday following Sunday holiday - automatically including previous weekend (Friday-Monday)',
        };
      }
    }
    return { extend: false };
  }

  // Tuesday: Only extend if Monday is also a public holiday AND Sunday is also a holiday
  if (dayOfWeek === 2) {
    if (isPublicHoliday(date, holidays)) {
      const monday = subDays(date, 1);
      if (isPublicHoliday(monday, holidays)) {
        const sunday = subDays(date, 2);
        if (isPublicHoliday(sunday, holidays)) {
          return {
            extend: true,
            startDate: subDays(date, 4), // Friday (4 days before Tuesday)
            endDate: date,
            reason: 'Selected Tuesday holiday following Monday and Sunday holidays - automatically including full weekend (Friday-Tuesday)',
          };
        }
      }
    }
    return { extend: false };
  }

  return { extend: false };
}

/**
 * Auto-extend selection to meet mandatory weekend requirements
 */
export function autoExtendForMandatoryWeekend(
  startDate: Date,
  endDate: Date,
  period: Period,
  holidays: Holiday[]
): { startDate: Date; endDate: Date; extended: boolean; reason?: string } {
  const weekendStart = checkMandatoryWeekendStart(period, holidays);
  const weekendEnd = checkMandatoryWeekendEnd(period, holidays);

  let newStart = startDate;
  let newEnd = endDate;
  let extended = false;
  let reason: string | undefined;

  // Check if start date itself needs auto-extension
  const startExtension = shouldAutoExtendDate(startDate, holidays);
  if (startExtension.extend) {
    if (startExtension.startDate) {
      newStart = new Date(Math.min(newStart.getTime(), startExtension.startDate.getTime()));
      extended = true;
      reason = startExtension.reason;
    }
    if (startExtension.endDate) {
      newEnd = new Date(Math.max(newEnd.getTime(), startExtension.endDate.getTime()));
      extended = true;
      reason = reason || startExtension.reason;
    }
  }

  // Check if end date needs auto-extension
  const endExtension = shouldAutoExtendDate(endDate, holidays);
  if (endExtension.extend) {
    if (endExtension.startDate) {
      newStart = new Date(Math.min(newStart.getTime(), endExtension.startDate.getTime()));
      extended = true;
      reason = reason || endExtension.reason;
    }
    if (endExtension.endDate) {
      newEnd = new Date(Math.max(newEnd.getTime(), endExtension.endDate.getTime()));
      extended = true;
      reason = reason || endExtension.reason;
    }
  }

  // Check if selection overlaps with mandatory weekend start
  if (weekendStart.required && weekendStart.extendedStartDate && weekendStart.extendedEndDate) {
    const overlaps = isWithinInterval(weekendStart.extendedStartDate, {
      start: newStart,
      end: newEnd,
    }) || isWithinInterval(newStart, {
      start: weekendStart.extendedStartDate,
      end: weekendStart.extendedEndDate,
    });

    if (overlaps) {
      newStart = new Date(Math.min(newStart.getTime(), weekendStart.extendedStartDate.getTime()));
      newEnd = new Date(Math.max(newEnd.getTime(), weekendStart.extendedEndDate.getTime()));
      extended = true;
      reason = weekendStart.reason;
    }
  }

  // Check if selection overlaps with mandatory weekend end
  if (weekendEnd.required && weekendEnd.extendedStartDate && weekendEnd.extendedEndDate) {
    const overlaps = isWithinInterval(weekendEnd.extendedEndDate, {
      start: newStart,
      end: newEnd,
    }) || isWithinInterval(newEnd, {
      start: weekendEnd.extendedStartDate,
      end: weekendEnd.extendedEndDate,
    });

    if (overlaps) {
      newStart = new Date(Math.min(newStart.getTime(), weekendEnd.extendedStartDate.getTime()));
      newEnd = new Date(Math.max(newEnd.getTime(), weekendEnd.extendedEndDate.getTime()));
      extended = true;
      reason = reason || weekendEnd.reason;
    }
  }

  return {
    startDate: newStart,
    endDate: newEnd,
    extended,
    reason,
  };
}
