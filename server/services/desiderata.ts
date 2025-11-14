import { readFile, writeFile, getStorageKey } from "./storage.js";
import { readSiteData, writeSiteData } from "../utils.js";
import { buildGrid } from "./calendar-fns.js";
import { parseISO, eachDayOfInterval, getDay, differenceInDays } from "date-fns";
import _ from '../utils/lodash';

export interface DesiderataUsage {
  weekendsUsed: number;
  workingDaysUsed: number;
  lastUpdated: string;
}

export interface DesiderataValidationResult {
  valid: boolean;
  weekendsUsed: number;
  workingDaysUsed: number;
  weekendsAllowed: number;
  workingDaysAllowed: number;
  weekendsRemaining: number;
  workingDaysRemaining: number;
  error?: string;
}

/**
 * Calculate how many weekends and working days are in an event
 */
export function calculateEventDays(startDate: string, endDate: string): {
  weekends: number;
  workingDays: number;
} {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const days = eachDayOfInterval({ start, end });

  let weekends = 0;
  let workingDays = 0;

  for (const day of days) {
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Saturday or Sunday - count as 0.5 weekend each
      weekends += 0.5;
    } else {
      // Monday-Friday
      workingDays += 1;
    }
  }

  return { weekends: Math.ceil(weekends), workingDays };
}

/**
 * Get user's desiderata usage for a specific period
 */
export async function getUserDesiderataUsage(
  site: string,
  userId: string,
  periodId: string
): Promise<DesiderataUsage> {
  try {
    const siteData = await readSiteData(site);
    const user = siteData.users.find((u: any) => u.id === userId);

    if (!user || !user.desiderataUsage || !user.desiderataUsage[periodId]) {
      return {
        weekendsUsed: 0,
        workingDaysUsed: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    return user.desiderataUsage[periodId];
  } catch (error) {
    console.error(`Failed to get desiderata usage for user ${userId}:`, error);
    return {
      weekendsUsed: 0,
      workingDaysUsed: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Update user's desiderata usage for a specific period
 */
export async function updateUserDesiderataUsage(
  site: string,
  userId: string,
  periodId: string,
  weekendsUsed: number,
  workingDaysUsed: number
): Promise<void> {
  const siteData = await readSiteData(site);
  const userIndex = siteData.users.findIndex((u: any) => u.id === userId);

  if (userIndex === -1) {
    throw new Error(`User ${userId} not found`);
  }

  const user = siteData.users[userIndex];

  if (!user.desiderataUsage) {
    user.desiderataUsage = {};
  }

  user.desiderataUsage[periodId] = {
    weekendsUsed,
    workingDaysUsed,
    lastUpdated: new Date().toISOString()
  };

  await writeSiteData(site, siteData);
}

/**
 * Validate if a user can create/update a desiderata event
 */
export async function validateDesiderataQuota(
  site: string,
  userId: string,
  periodId: string,
  eventStartDate: string,
  eventEndDate: string,
  excludeEventId?: string
): Promise<DesiderataValidationResult> {
  try {
    // Get period quotas
    const periodsKey = getStorageKey(site, "periods", new Date(eventStartDate).getFullYear().toString());
    const periodsDataStr = await readFile(periodsKey);
    const periodsData = JSON.parse(periodsDataStr);

    const period = periodsData.periods.find((p: any) => p.id === periodId);

    if (!period || !period.quotas) {
      return {
        valid: false,
        weekendsUsed: 0,
        workingDaysUsed: 0,
        weekendsAllowed: 0,
        workingDaysAllowed: 0,
        weekendsRemaining: 0,
        workingDaysRemaining: 0,
        error: "Period quotas not configured"
      };
    }

    // Calculate days in the new/updated event
    const eventDays = calculateEventDays(eventStartDate, eventEndDate);

    // Get current usage
    const currentUsage = await getUserDesiderataUsage(site, userId, periodId);

    // Get all user's events to recalculate (excluding the one being updated)
    const eventsKey = getStorageKey(site, "events", userId);
    let userEvents: any[] = [];
    try {
      const eventsDataStr = await readFile(eventsKey);
      userEvents = JSON.parse(eventsDataStr);
    } catch {
      userEvents = [];
    }

    // Filter out the event being updated and recalculate actual usage
    const relevantEvents = userEvents.filter((e: any) => {
      if (excludeEventId && e.id === excludeEventId) return false;
      if (e.type !== 'desiderata') return false;

      // Check if event is within the period
      const eventStart = parseISO(e.date);
      const periodStart = parseISO(period.startDate);
      const periodEnd = parseISO(period.endDate);

      return eventStart >= periodStart && eventStart <= periodEnd;
    });

    let actualWeekendsUsed = 0;
    let actualWorkingDaysUsed = 0;

    for (const event of relevantEvents) {
      const days = calculateEventDays(event.date, event.endDate || event.date);
      actualWeekendsUsed += days.weekends;
      actualWorkingDaysUsed += days.workingDays;
    }

    // Add the new/updated event
    const totalWeekendsUsed = actualWeekendsUsed + eventDays.weekends;
    const totalWorkingDaysUsed = actualWorkingDaysUsed + eventDays.workingDays;

    const weekendsRemaining = period.quotas.allowedWeekendDesiderata - totalWeekendsUsed;
    const workingDaysRemaining = period.quotas.allowedWorkingDayDesiderata - totalWorkingDaysUsed;

    const valid = weekendsRemaining >= 0 && workingDaysRemaining >= 0;

    return {
      valid,
      weekendsUsed: totalWeekendsUsed,
      workingDaysUsed: totalWorkingDaysUsed,
      weekendsAllowed: period.quotas.allowedWeekendDesiderata,
      workingDaysAllowed: period.quotas.allowedWorkingDayDesiderata,
      weekendsRemaining: Math.max(0, weekendsRemaining),
      workingDaysRemaining: Math.max(0, workingDaysRemaining),
      error: !valid ? "Desiderata quota exceeded" : undefined
    };
  } catch (error) {
    console.error("Failed to validate desiderata quota:", error);
    return {
      valid: false,
      weekendsUsed: 0,
      workingDaysUsed: 0,
      weekendsAllowed: 0,
      workingDaysAllowed: 0,
      weekendsRemaining: 0,
      workingDaysRemaining: 0,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

/**
 * Recalculate and update user's desiderata usage for a period
 */
export async function recalculateUserDesiderata(
  site: string,
  userId: string,
  periodId: string
): Promise<void> {
  try {
    // Get period info
    const periodsKey = getStorageKey(site, "periods", "2026"); // TODO: Make year dynamic
    const periodsDataStr = await readFile(periodsKey);
    const periodsData = JSON.parse(periodsDataStr);
    const period = periodsData.periods.find((p: any) => p.id === periodId);

    if (!period) {
      throw new Error(`Period ${periodId} not found`);
    }

    // Get all user's desiderata events in this period
    const eventsKey = getStorageKey(site, "events", userId);
    let userEvents: any[] = [];
    try {
      const eventsDataStr = await readFile(eventsKey);
      userEvents = JSON.parse(eventsDataStr);
    } catch {
      userEvents = [];
    }

    const desiderataEvents = userEvents.filter((e: any) => {
      if (e.type !== 'desiderata') return false;

      const eventStart = parseISO(e.date);
      const periodStart = parseISO(period.startDate);
      const periodEnd = parseISO(period.endDate);

      return eventStart >= periodStart && eventStart <= periodEnd;
    });

    let totalWeekends = 0;
    let totalWorkingDays = 0;

    for (const event of desiderataEvents) {
      const days = calculateEventDays(event.date, event.endDate || event.date);
      totalWeekends += days.weekends;
      totalWorkingDays += days.workingDays;
    }

    await updateUserDesiderataUsage(site, userId, periodId, totalWeekends, totalWorkingDays);
  } catch (error) {
    console.error(`Failed to recalculate desiderata for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get all pending desiderata requests for a specific period
 */
export async function getPendingDesiderataByPeriod(
  site: string,
  year: string,
  periodId: string
): Promise<{ desiderata: any[]; grid: any[] }> {
  try {
    // Get period info
    const periodsKey = getStorageKey("sites", site, "periods", year + '.json');
    const periodsDataStr = await readFile(periodsKey);
    const periodsData = JSON.parse(periodsDataStr);
    const period = periodsData.periods.find((p: any) => p.id === periodId);

    if (!period) {
      throw new Error(`Period ${periodId} not found for year ${year}`);
    }

    const periodStart = parseISO(period.startDate);
    const periodEnd = parseISO(period.endDate);

    // Get all users in the site
    const siteData = await readSiteData(site);
    const pendingRequests: any[] = [];

    // Iterate through all users
    for (const user of siteData.users) {
      try {
        const eventsKey = getStorageKey("sites", site, "events", user.id + '.json');
        let userEvents: any[] = [];

        try {
          const eventsDataStr = await readFile(eventsKey);
          userEvents = JSON.parse(eventsDataStr);
        } catch {
          continue; // Skip if user has no events
        }

        // Filter for pending desiderata within the period
        const userPendingDesiderata = userEvents.filter((e: any) => {
          return (e.type === 'requestedDesiderata' &&
            e.status === 'pending' &&
            parseISO(e.date) >= periodStart && parseISO(e.endDate) <= periodEnd
          );
        });

        // Add user info to each request
        for (const event of userPendingDesiderata) {
          pendingRequests.push({
            userId: user.id,
            ..._.pick(event, ['id', 'date', 'endDate'])
          },
            // user: {
            //   id: user.id,
            //   firstName: user.firstName,
            //   lastName: user.lastName,
            //   email: user.email
            // }
          );
        }
      } catch (error) {
        console.error(`Failed to get events for user ${user.id}:`, error);
        continue;
      }
    }

    const grid = buildGrid(period, pendingRequests.map(r => ({
      userId: r.userId,
      date: r.date,
      endDate: r.endDate
    })), siteData);

    return { desiderata: pendingRequests, grid: grid };
  } catch (error) {
    console.error(`Failed to get pending desiderata for period ${periodId}:`, error);
    throw error;
  }
}
