import { Event } from "../../types/event";
import { User } from "../../types/user";
import { useEventPermissions } from "../../hooks/useEventPermissions";
import { SingleDayEventBar } from "./SingleDayEventBar";
import { MultiDayEventBar } from "./MultiDayEventBar";

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
  const isMultiDay = event.endDate && event.endDate !== event.date;

  const handleDragStart = (e: React.DragEvent) => {
    if (!canModify) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', event.id);
    onDragStart?.(event);
  };

  if (isMultiDay) {
    return (
      <MultiDayEventBar
        event={event}
        date={date}
        userSettings={userSettings}
        canModify={canModify}
        onResize={onResize!}
      />
    );
  }

  return (
    <SingleDayEventBar
      event={event}
      userSettings={userSettings}
      canModify={canModify}
      isDragging={isDragging}
      onDelete={onDelete}
      onDragStart={handleDragStart}
      onResize={onResize!}
      currentUser={currentUser}
    />
  );
}