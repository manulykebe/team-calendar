import { memo } from 'react';
import { format, isFirstDayOfMonth } from "date-fns";
import { EventCard } from "./EventCard";
import { MonthLabel } from "./MonthLabel";
import { useFilteredEvents } from "../../hooks/useFilteredEvents";
import { useCalendarColors } from "../../hooks/useCalendarColors";
import { Event } from "../../types/event";
import { User } from "../../types/user";

interface DayCellProps {
  date: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  userSettings?: any;
  onEventDelete?: (eventId: string) => void;
  currentUser?: User | null;
  onEventResize?: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
}

export const DayCell = memo(function DayCell({
  date,
  events,
  onDateClick,
  userSettings,
  onEventDelete,
  currentUser,
  onEventResize,
}: DayCellProps) {
  const { getColumnColor } = useCalendarColors(currentUser);
  const formattedDate = format(date, "yyyy-MM-dd");
  const dayEvents = useFilteredEvents(events, formattedDate, currentUser);
  const backgroundColor = getColumnColor(date);
  const showMonthLabel = isFirstDayOfMonth(date);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onDateClick(date);
  };

  return (
    <div
      className="relative p-2 hover:bg-opacity-90 transition-colors"
      style={{ backgroundColor }}
      onContextMenu={handleContextMenu}
    >
      {showMonthLabel && <MonthLabel date={date} />}
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-zinc-700">
          {format(date, "d")}
        </span>
        {dayEvents.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {dayEvents.length}
          </span>
        )}
      </div>
      <div className="mt-2 relative">
        {dayEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            date={formattedDate}
            userSettings={userSettings}
            onDelete={onEventDelete}
            currentUser={currentUser}
            onResize={onEventResize}
          />
        ))}
      </div>
    </div>
  );
});