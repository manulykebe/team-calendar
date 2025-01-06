import { Trash2 } from "lucide-react";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { EventResizeHandle } from "./EventResizeHandle";
import { useEventResize } from "../../hooks/useEventResize";

interface SingleDayEventBarProps {
  event: Event & { verticalPosition: number };
  userSettings?: User["settings"];
  canModify: boolean;
  isDragging?: boolean;
  onDelete?: (eventId: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onResize: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
  currentUser?: User | null;
}

export function SingleDayEventBar({
  event,
  userSettings,
  canModify,
  isDragging,
  onDelete,
  onDragStart,
  onResize,
  currentUser
}: SingleDayEventBarProps) {
  const { isResizing, handleResizeStart } = useEventResize({
    eventId: event.id,
    date: event.date,
    endDate: event.endDate,
    onResize
  });

  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || "#e2e8f0";
  const prefix = colleagueSettings?.initials ? `[${colleagueSettings.initials}] ` : "";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && canModify) {
      onDelete(event.id);
    }
  };

  // Calculate top position based on verticalPosition
  const topPosition = event.verticalPosition * 24; // Reduced from 28px

  return (
    <div
      draggable={canModify && !isResizing}
      onDragStart={onDragStart}
      className={`absolute left-0 right-0 flex items-center justify-between text-xs px-2 rounded 
        ${canModify ? 'cursor-move' : 'cursor-default'} 
        ${isDragging ? 'opacity-50' : ''}`}
      style={{
        backgroundColor,
        color: backgroundColor === "#fee090" || backgroundColor === "#e0f3f8" ? "#1a202c" : "white",
        top: `${topPosition}px`,
        height: '20px', // Reduced from 24px
        zIndex: isResizing ? 20 : 10
      }}
    >
      {canModify && (
        <>
          <EventResizeHandle
            position="left"
            onMouseDown={(e) => handleResizeStart('start', e)}
          />
          <EventResizeHandle
            position="right"
            onMouseDown={(e) => handleResizeStart('end', e)}
          />
        </>
      )}
      
      <span className="truncate flex-1 px-4">
        {prefix}
        {event.title}
      </span>
      
      {canModify && onDelete && (
        <button
          onClick={handleDelete}
          className="p-0.5 hover:bg-black/10 rounded ml-1"
          aria-label="Delete event"
          title={currentUser?.role === "admin" ? "Delete as admin" : "Delete event"}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}