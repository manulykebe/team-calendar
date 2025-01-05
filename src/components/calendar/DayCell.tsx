import { memo } from "react";
import { format } from "date-fns";
import { EventCard } from "./EventCard";
import { useFilteredEvents } from "../../hooks/useFilteredEvents";
import { useCalendarColors } from "../../hooks/useCalendarColors";
import { useEventDeletion } from "../../hooks/useEventDeletion";
import { Event } from "../../types/event";
import { User } from "../../types/user";

interface DayCellProps {
  date: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  userSettings?: any;
  onEventDelete?: (eventId: string) => void;
  currentUser?: User | null;
}

export const DayCell = memo(function DayCell({
  date,
  events,
  onDateClick,
  userSettings,
  onEventDelete,
  currentUser,
}: DayCellProps) {
  const { getColumnColor } = useCalendarColors(currentUser);
  const { handleEventDelete } = useEventDeletion();
  const formattedDate = format(date, "yyyy-MM-dd");
  const dayEvents = useFilteredEvents(events, formattedDate);
  const backgroundColor = getColumnColor(date);

  const deleteEventHandler = async (eventId: string) => {
    try {
      await handleEventDelete(eventId, onEventDelete);
    } catch (error) {
      // Error is already logged in useEventDeletion
    }
  };

  return (
    <div
      className="min-h-[120px] p-2 hover:bg-opacity-90 transition-colors"
      style={{ backgroundColor }}
      onClick={() => onDateClick(date)}
    >
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
      <div className="mt-2 space-y-1">
        {dayEvents.slice(0, 2).map((event) => (
          <EventCard
            key={event.id}
            event={event}
            userSettings={userSettings}
            onDelete={deleteEventHandler}
            currentUser={currentUser}
          />
        ))}
        {dayEvents.length > 2 && (
          <div className="text-xs text-zinc-500">
            +{dayEvents.length - 2} more
          </div>
        )}
      </div>
    </div>
  );
});