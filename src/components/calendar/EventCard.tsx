import { Trash2, Calendar } from "lucide-react";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { useEventPermissions } from "../../hooks/useEventPermissions";
import { format, parseISO, differenceInDays } from "date-fns";
import { EventResizeHandle } from "./EventResizeHandle";
import { useEventResize } from "../../hooks/useEventResize";

interface EventCardProps {
  event: Event;
  userSettings?: User["settings"];
  onDelete?: (eventId: string) => void;
  currentUser?: User | null;
  isDragging?: boolean;
  onDragStart?: (event: Event) => void;
  onResize?: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
}

export function EventCard({
  event,
  userSettings,
  onDelete,
  currentUser,
  isDragging,
  onDragStart,
  onResize,
}: EventCardProps) {
  const { canModify } = useEventPermissions(event, currentUser);
  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || "#e2e8f0";
  const prefix = colleagueSettings?.initials ? `[${colleagueSettings.initials}] ` : "";

  const handleResize = async (newDate: string, newEndDate?: string) => {
    if (onResize && canModify) {
      await onResize(event.id, newDate, newEndDate);
    }
  };

  const { handleResizeStart, isResizing } = useEventResize({
    onResize: handleResize,
    date: event.date,
    endDate: event.endDate
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && canModify) {
      onDelete(event.id);
    }
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
  const duration = isMultiDay 
    ? differenceInDays(parseISO(event.endDate!), parseISO(event.date)) + 1
    : 1;

  return (
    <div
      draggable={canModify && !isResizing}
      onDragStart={handleDragStart}
      className={`relative flex items-center justify-between text-xs px-1 py-0.5 rounded group hover:ring-1 hover:ring-zinc-300 ${
        canModify ? 'cursor-move' : 'cursor-default'
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{
        backgroundColor,
        color: backgroundColor === "#fee090" || backgroundColor === "#e0f3f8"
          ? "#1a202c"
          : "white",
      }}
    >
      {canModify && (
        <>
          <EventResizeHandle
            position="left"
            onMouseDown={(e) => handleResizeStart('left', e)}
          />
          <EventResizeHandle
            position="right"
            onMouseDown={(e) => handleResizeStart('right', e)}
          />
        </>
      )}
      
      <span className="truncate flex-1 mx-4">
        {prefix}
        {event.title}
      </span>
      <div className="flex items-center space-x-1">
        {isMultiDay && (
          <span className="flex items-center" title={`${duration} day event`}>
            <Calendar className="w-3 h-3 mr-1" />
            {duration}d
          </span>
        )}
        {canModify && onDelete && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 rounded"
            aria-label="Delete event"
            title={currentUser?.role === "admin" ? "Delete as admin" : "Delete event"}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}