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

    // Create a map for quick order lookup
    const orderMap = new Map(colleagueOrder.map((id, index) => [id, index]));

    // Sort by colleague order
    return visibleEvents.sort((a, b) => {
      const aPosition = orderMap.get(a.userId) ?? Number.MAX_SAFE_INTEGER;
      const bPosition = orderMap.get(b.userId) ?? Number.MAX_SAFE_INTEGER;
      return aPosition - bPosition;
    });
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