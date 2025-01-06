import { useMemo } from 'react';
import { Event } from '../types/event';
import { User } from '../types/user';
import { isWithinInterval, parseISO } from 'date-fns';

export function useFilteredEvents(events: Event[], date: string, currentUser?: User | null) {
  return useMemo(() => {
    const targetDate = parseISO(date);
    
    // If no current user or settings, return filtered events by date only
    if (!currentUser?.settings) {
      return filterEventsByDate(events, date, targetDate);
    }

    // Get colleague settings and order
    const { colleagues, colleagueOrder = [] } = currentUser.settings;

    // Filter events by date and visibility
    const visibleEvents = filterEventsByDate(events, date, targetDate).filter(event => {
      // Always show current user's events
      if (event.userId === currentUser.id) return true;
      
      // Check if colleague is visible
      return colleagues?.[event.userId]?.visible !== false;
    });

    // Create a map for colleague order positions
    const orderMap = new Map<string, number>();
    
    // First, add current user at position 0
    orderMap.set(currentUser.id, 0);
    let position = 1;

    // Then add ordered colleagues
    colleagueOrder.forEach(userId => {
      if (userId !== currentUser.id && !orderMap.has(userId)) {
        orderMap.set(userId, position++);
      }
    });

    // Finally, add any remaining colleagues
    visibleEvents.forEach(event => {
      if (!orderMap.has(event.userId)) {
        orderMap.set(event.userId, position++);
      }
    });

    // Add vertical position to events based on colleague order
    return visibleEvents
      .map(event => ({
        ...event,
        verticalPosition: orderMap.get(event.userId) || 0
      }))
      .sort((a, b) => a.verticalPosition - b.verticalPosition);
  }, [events, date, currentUser]);
}

function filterEventsByDate(events: Event[], date: string, targetDate: Date) {
  return events.filter(event => {
    if (!event.endDate) {
      return event.date === date;
    }
    return isWithinInterval(targetDate, {
      start: parseISO(event.date),
      end: parseISO(event.endDate)
    });
  });
}