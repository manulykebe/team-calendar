import { useMemo } from 'react';
import { Event } from '../types/event';

export function useFilteredEvents(events: Event[], date: string) {
  return useMemo(() => {
    return events.filter(event => event.date === date);
  }, [events, date]);
}