import { useMemo } from "react";
import { Event } from "../types/event";
import { User } from "../types/user";
import { isWithinInterval, parseISO } from "date-fns";

const HOLIDAY_TYPES = ["requestedLeave", "requestedDesiderata"];

export function useFilteredEvents(
  events: Event[],
  date: string,
  currentUser?: User | null,
) {
  return useMemo(() => {
    const targetDate = parseISO(date);

    // Pre-filter events by date for better performance
    const dateFilteredEvents = filterEventsByDate(events, date, targetDate);
    
    // Early return if no events
    if (dateFilteredEvents.length === 0) {
      return [];
    }

    const isAdmin = currentUser?.role === "admin";

    // Filter events by visibility rules
    const visibleEvents = dateFilteredEvents.filter((event) => {
      // For current user, show all their events
      if (event.userId === currentUser?.id) {
        return true;
      }

      // For admins, show ALL events from colleagues (respecting visibility)
      if (isAdmin) {
        // Check colleague visibility settings
        if (!currentUser?.settings?.colleagues) {
          return true; // Show all if no settings
        }
        return currentUser.settings.colleagues[event.userId]?.visible !== false;
      }

      // For regular users with other users' events, check visibility settings
      if (!currentUser?.settings?.colleagues) {
        return true;
      }

      // Check if colleague is visible
      return currentUser.settings.colleagues[event.userId]?.visible !== false;
    });

    // Early return if no visible events
    if (visibleEvents.length === 0) {
      return [];
    }

    // Get colleague settings and order
    const { colleagues = {}, colleagueOrder = [] } = currentUser?.settings || {};

    // Create a map for colleague order positions (more efficient than repeated indexOf)
    const orderMap = new Map<string, number>();

    // First, add current user at position 0
    if (currentUser) {
      orderMap.set(currentUser.id, 0);
    }
    let position = 1;

    // Then add ordered colleagues
    for (const userId of colleagueOrder) {
      if (!currentUser || (userId !== currentUser.id && !orderMap.has(userId))) {
        orderMap.set(userId, position++);
      }
    }

    // Finally, add any remaining colleagues
    for (const event of visibleEvents) {
      if (!orderMap.has(event.userId)) {
        orderMap.set(event.userId, position++);
      }
    }

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
    
    try {
      return isWithinInterval(targetDate, {
        start: parseISO(event.date),
        end: parseISO(event.endDate),
      });
    } catch (error) {
      // Handle invalid dates gracefully
      console.warn(`Invalid date in event ${event.id}:`, error);
      return false;
    }
  });
}