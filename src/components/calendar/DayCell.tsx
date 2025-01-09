import { memo } from 'react';
import { format, isFirstDayOfMonth } from "date-fns";
import { EventCard } from "./EventCard";
import { MonthLabel } from "./MonthLabel";
import { useFilteredEvents } from "../../hooks/useFilteredEvents";
import { useCalendarColors } from "../../hooks/useCalendarColors";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { Holiday } from "../../lib/api/holidays";
import { Calendar } from "lucide-react";

interface DayCellProps {
  date: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  userSettings?: any;
  onEventDelete?: (eventId: string) => void;
  currentUser?: User | null;
  onEventResize?: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
  holiday?: Holiday;
}

export const DayCell = memo(function DayCell({
  date,
  events,
  onDateClick,
  userSettings,
  onEventDelete,
  currentUser,
  onEventResize,
  holiday,
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
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-1">
          <span className={`text-sm font-medium ${holiday ? 'text-red-600' : 'text-zinc-700'}`}>
            {format(date, "d")}
          </span>
          {holiday && (
            <div className="inline-flex items-center text-xs text-red-600 bg-red-50 rounded px-1.5 py-0.5" title={holiday.name}>
              <Calendar className="w-3 h-3 mr-1" />
              <span className="truncate max-w-[80px]">{holiday.name}</span>
            </div>
          )}
        </div>
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