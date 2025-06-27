import { useMemo } from "react";
import { Event } from "../types/event";
import { User } from "../types/user";
import { isWithinInterval, parseISO, format, startOfMonth, endOfMonth } from "date-fns";

interface UseOptimizedEventsProps {
  events: Event[];
  currentMonth: Date;
  currentUser?: User | null;
}

const HOLIDAY_TYPES = ["requestedLeave", "requestedDesiderata"];

/**
 * Optimized hook for filtering and processing events
 * Only processes events that are visible in the current month view
 */
export function useOptimizedEvents({
  events,
  currentMonth,
  currentUser
}: UseOptimizedEventsProps) {
  
  return useMemo(() => {
    // Calculate the visible date range (current month + buffer for multi-day events)
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Pre-filter events to only those that could be visible in the current view
    const visibleEvents = events.filter(event => {
      try {
        const eventStart = parseISO(event.date);
        const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;
        
        // Check if event overlaps with the visible month
        return isWithinInterval(eventStart, { start: monthStart, end: monthEnd }) ||
               isWithinInterval(eventEnd, { start: monthStart, end: monthEnd }) ||
               (eventStart <= monthStart && eventEnd >= monthEnd);
      } catch (error) {
        console.warn(`Invalid date in event ${event.id}:`, error);
        return false;
      }
    });

    // Group events by date for faster lookups
    const eventsByDate = new Map<string, Event[]>();
    
    visibleEvents.forEach(event => {
      if (!event.endDate) {
        // Single day event
        const dateKey = event.date;
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, []);
        }
        eventsByDate.get(dateKey)!.push(event);
      } else {
        // Multi-day event - add to each day in the range
        try {
          const startDate = parseISO(event.date);
          const endDate = parseISO(event.endDate);
          
          let currentDate = startDate;
          while (currentDate <= endDate) {
            const dateKey = format(currentDate, 'yyyy-MM-dd');
            if (!eventsByDate.has(dateKey)) {
              eventsByDate.set(dateKey, []);
            }
            eventsByDate.get(dateKey)!.push(event);
            
            // Move to next day
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } catch (error) {
          console.warn(`Invalid date range in event ${event.id}:`, error);
        }
      }
    });

    // Create colleague visibility map for faster lookups
    const colleagueVisibility = new Map<string, boolean>();
    if (currentUser?.settings?.colleagues) {
      Object.entries(currentUser.settings.colleagues).forEach(([userId, settings]) => {
        colleagueVisibility.set(userId, settings.visible !== false);
      });
    }

    // Create colleague order map for faster sorting
    const colleagueOrder = new Map<string, number>();
    if (currentUser) {
      colleagueOrder.set(currentUser.id, 0);
      
      const orderArray = currentUser.settings?.colleagueOrder || [];
      orderArray.forEach((userId, index) => {
        if (userId !== currentUser.id) {
          colleagueOrder.set(userId, index + 1);
        }
      });
    }

    return {
      eventsByDate,
      colleagueVisibility,
      colleagueOrder,
      totalEvents: visibleEvents.length
    };
  }, [events, currentMonth, currentUser]);
}

/**
 * Get events for a specific date using the optimized data structure
 */
export function getEventsForDate(
  date: string,
  eventsByDate: Map<string, Event[]>,
  colleagueVisibility: Map<string, boolean>,
  colleagueOrder: Map<string, number>,
  currentUser?: User | null
): Event[] {
  const dateEvents = eventsByDate.get(date) || [];
  
  if (dateEvents.length === 0) {
    return [];
  }

  const isAdmin = currentUser?.role === "admin";

  // Filter by visibility
  const visibleEvents = dateEvents.filter(event => {
    // For current user, show all their events
    if (event.userId === currentUser?.id) {
      return true;
    }

    // For admins, show ALL events from colleagues (respecting visibility)
    if (isAdmin) {
      return colleagueVisibility.get(event.userId) !== false;
    }

    // For regular users, check visibility settings
    return colleagueVisibility.get(event.userId) !== false;
  });

  // Add vertical positioning and sort
  return visibleEvents
    .map(event => ({
      ...event,
      verticalPosition: colleagueOrder.get(event.userId) || 999
    }))
    .sort((a, b) => a.verticalPosition - b.verticalPosition);
}