import { memo } from 'react';
import { format } from 'date-fns';
import { EventCard } from './EventCard';
import { useFilteredEvents } from '../../hooks/useFilteredEvents';
import { Event } from '../../types/event';

interface DayCellProps {
  date: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  userSettings?: any;
}

export const DayCell = memo(function DayCell({ 
  date, 
  events, 
  onDateClick,
  userSettings 
}: DayCellProps) {
  const formattedDate = format(date, 'yyyy-MM-dd');
  const dayEvents = useFilteredEvents(events, formattedDate);

  return (
    <div
      className="min-h-[120px] bg-white p-2"
      onClick={() => onDateClick(date)}
    >
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-gray-700">
          {format(date, 'd')}
        </span>
        {dayEvents.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {dayEvents.length}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1">
        {dayEvents.slice(0, 2).map((event) => (
          <EventCard
            key={event.id}
            event={event}
            userSettings={userSettings}
          />
        ))}
        {dayEvents.length > 2 && (
          <div className="text-xs text-gray-500">
            +{dayEvents.length - 2} more
          </div>
        )}
      </div>
    </div>
  );
});