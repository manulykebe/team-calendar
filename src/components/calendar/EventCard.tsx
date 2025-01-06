import { useState } from "react";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { useEventPermissions } from "../../hooks/useEventPermissions";
import { format, parseISO, addDays } from "date-fns";
import { MultiDayEventBar } from "./MultiDayEventBar";
import { SingleDayEventBar } from "./SingleDayEventBar";

interface EventCardProps {
  event: Event;
  date: string;
  userSettings?: User["settings"];
  onDelete?: (eventId: string) => void;
  currentUser?: User | null;
  isDragging?: boolean;
  onDragStart?: (event: Event) => void;
  onResize?: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
}

export function EventCard({
  event,
  date,
  userSettings,
  onDelete,
  currentUser,
  isDragging,
  onDragStart,
  onResize,
}: EventCardProps) {
  const { canModify } = useEventPermissions(event, currentUser);
  const [isResizing, setIsResizing] = useState(false);
  const [initialX, setInitialX] = useState(0);
  const [initialDate, setInitialDate] = useState<string | null>(null);

  const handleResizeStart = (edge: 'start' | 'end', e: React.MouseEvent) => {
    if (!canModify || !onResize) return;
    e.stopPropagation();
    setIsResizing(true);
    setInitialX(e.clientX);
    setInitialDate(event.date);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !initialDate) return;

      const deltaX = e.clientX - initialX;
      const dayWidth = 100; // Approximate width of a day cell
      const daysDelta = Math.round(deltaX / dayWidth);

      if (daysDelta === 0) return;

      const startDate = parseISO(initialDate);
      const endDate = event.endDate ? parseISO(event.endDate) : startDate;

      if (edge === 'start') {
        const newStartDate = format(addDays(startDate, daysDelta), 'yyyy-MM-dd');
        onResize(event.id, newStartDate, format(endDate, 'yyyy-MM-dd'));
      } else {
        const newEndDate = format(addDays(endDate, daysDelta), 'yyyy-MM-dd');
        onResize(event.id, initialDate, newEndDate);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setInitialX(0);
      setInitialDate(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!canModify || isResizing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(event);
  };

  const isMultiDay = event.endDate && event.endDate !== event.date;

  if (isMultiDay) {
    return (
      <MultiDayEventBar
        event={event}
        date={date}
        userSettings={userSettings}
        canModify={canModify}
        isResizing={isResizing}
        onResizeStart={handleResizeStart}
        onResize={onResize}
      />
    );
  }

  return (
    <SingleDayEventBar
      event={event}
      userSettings={userSettings}
      canModify={canModify}
      isResizing={isResizing}
      isDragging={isDragging}
      onDelete={onDelete}
      onDragStart={handleDragStart}
      onResizeStart={handleResizeStart}
      currentUser={currentUser}
    />
  );
}