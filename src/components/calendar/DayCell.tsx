import { memo } from 'react';
import { format, isFirstDayOfMonth } from "date-fns";
import { EventCard } from "./EventCard";
import { MonthLabel } from "./MonthLabel";
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
  draggedEvent?: Event | null;
  dragOverDate?: string | null;
  onEventDrop?: (date: string) => void;
  onDragOver?: (date: string, e: React.DragEvent) => void;
  onDragStart?: (event: Event) => void;
  onEventResize?: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
}

export const DayCell = memo(function DayCell({
  date,
  events,
  onDateClick,
  userSettings,
  onEventDelete,
  currentUser,
  draggedEvent,
  dragOverDate,
  onEventDrop,
  onDragOver,
  onDragStart,
  onEventResize,
}: DayCellProps) {
  const { getColumnColor } = useCalendarColors(currentUser);
  const { handleEventDelete } = useEventDeletion();
  const formattedDate = format(date, "yyyy-MM-dd");
  const dayEvents = useFilteredEvents(events, formattedDate, currentUser);
  const backgroundColor = getColumnColor(date);
  const isOver = dragOverDate === formattedDate;
  const showMonthLabel = isFirstDayOfMonth(date);

  const deleteEventHandler = async (eventId: string) => {
    try {
      await handleEventDelete(eventId, onEventDelete);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(formattedDate, e);
  };

  const handleDrop = () => {
    onEventDrop?.(formattedDate);
  };

  return (
    <div
      className={`relative min-h-[120px] p-2 hover:bg-opacity-90 transition-colors ${
        isOver ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ backgroundColor }}
      onClick={() => onDateClick(date)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
      <div className="mt-2 space-y-1">
        {dayEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            date={formattedDate}
            userSettings={userSettings}
            onDelete={deleteEventHandler}
            currentUser={currentUser}
            isDragging={draggedEvent?.id === event.id}
            onDragStart={onDragStart}
            onResize={onEventResize}
          />
        ))}
      </div>
    </div>
  );
});