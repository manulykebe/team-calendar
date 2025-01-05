import { useMemo } from 'react';
import { Event } from '../types/event';
import { isWithinInterval, parseISO } from 'date-fns';

export function useFilteredEvents(events: Event[], date: string) {
  return useMemo(() => {
    const targetDate = parseISO(date);
    return events.filter(event => {
      // If it's a single day event
      if (!event.endDate) {
        return event.date === date;
      }
      
      // If it's a multi-day event
      return isWithinInterval(targetDate, {
        start: parseISO(event.date),
        end: parseISO(event.endDate)
      });
    });
  }, [events, date]);
}