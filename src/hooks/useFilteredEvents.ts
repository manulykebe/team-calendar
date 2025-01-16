import { useMemo } from "react";
import { Event } from "../types/event";
import { User } from "../types/user";
import { isWithinInterval, parseISO } from "date-fns";

const HOLIDAY_TYPES = ["requestedHoliday", "requestedHolidayMandatory"];

export function useFilteredEvents(
  events: Event[],
  date: string,
  currentUser?: User | null,
) {
  return useMemo(() => {
    const targetDate = parseISO(date);

    // Filter events by date and visibility rules
    const visibleEvents = filterEventsByDate(events, date, targetDate)
      .filter((event) => {
        // For current user, show all non-holiday events
        if (event.userId === currentUser?.id) {
          return !HOLIDAY_TYPES.includes(event.type);
        }

        // For other users, check visibility settings
        if (!currentUser?.settings) {
          return true;
        }

        // Check if colleague is visible
        return currentUser.settings.colleagues?.[event.userId]?.visible !== false;
      });

    // Get colleague settings and order
    const { colleagues, colleagueOrder = [] } = currentUser?.settings || {};

    // Create a map for colleague order positions
    const orderMap = new Map<string, number>();

    // First, add current user at position 0
    if (currentUser) {
      orderMap.set(currentUser.id, 0);
    }
    let position = 1;

    // Then add ordered colleagues
    colleagueOrder.forEach((userId) => {
      if (!currentUser || (userId !== currentUser.id && !orderMap.has(userId))) {
        orderMap.set(userId, position++);
      }
    });

    // Finally, add any remaining colleagues
    visibleEvents.forEach((event) => {
      if (!orderMap.has(event.userId)) {
        orderMap.set(event.userId, position++);
      }
    });

    // Add vertical position to events based on colleague order
    return visibleEvents
      .map((event) => ({
        ...event,
        verticalPosition: orderMap.get(event.userId) || 0,
      }))
      .sort((a, b) => a.verticalPosition - b.verticalPosition);
  }, [events, date, currentUser]);
}

function filterEventsByDate(events: Event[], date: string, targetDate: Date) {
  return events.filter((event) => {
    if (!event.endDate) {
      return event.date === date;
    }
    return isWithinInterval(targetDate, {
      start: parseISO(event.date),
      end: parseISO(event.endDate),
    });
  });
}