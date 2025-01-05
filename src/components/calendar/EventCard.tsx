import { Trash2 } from "lucide-react";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { useEventPermissions } from "../../hooks/useEventPermissions";

interface EventCardProps {
  event: Event;
  userSettings?: User["settings"];
  onDelete?: (eventId: string) => void;
  currentUser?: User | null;
  isDragging?: boolean;
  onDragStart?: (event: Event) => void;
}

export function EventCard({
  event,
  userSettings,
  onDelete,
  currentUser,
  isDragging,
  onDragStart,
}: EventCardProps) {
  const { canModify } = useEventPermissions(event, currentUser);
  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || "#e2e8f0";
  const prefix = colleagueSettings?.initials ? `[${colleagueSettings.initials}] ` : "";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && canModify) {
      onDelete(event.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!canModify) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(event);
  };

  return (
    <div
      draggable={canModify}
      onDragStart={handleDragStart}
      className={`flex items-center justify-between text-xs px-1 py-0.5 rounded group hover:ring-1 hover:ring-zinc-300 ${
        canModify ? 'cursor-move' : 'cursor-default'
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{
        backgroundColor,
        color: backgroundColor === "#fee090" || backgroundColor === "#e0f3f8"
          ? "#1a202c"
          : "white",
      }}
    >
      <span className="truncate flex-1">
        {prefix}
        {event.title}
      </span>
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
  );
}