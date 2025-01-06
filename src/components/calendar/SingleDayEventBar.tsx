import { Trash2, GripVertical } from "lucide-react";
import { Event } from "../../types/event";
import { User } from "../../types/user";

interface SingleDayEventBarProps {
  event: Event;
  userSettings?: User["settings"];
  canModify: boolean;
  isResizing: boolean;
  isDragging?: boolean;
  onDelete?: (eventId: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onResizeStart: (edge: 'start' | 'end', e: React.MouseEvent) => void;
  currentUser?: User | null;
}

export function SingleDayEventBar({
  event,
  userSettings,
  canModify,
  isResizing,
  isDragging,
  onDelete,
  onDragStart,
  onResizeStart,
  currentUser
}: SingleDayEventBarProps) {
  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || "#e2e8f0";
  const prefix = colleagueSettings?.initials ? `[${colleagueSettings.initials}] ` : "";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && canModify) {
      onDelete(event.id);
    }
  };

  return (
    <div
      draggable={canModify && !isResizing}
      onDragStart={onDragStart}
      className={`relative flex items-center justify-between text-xs px-2 py-0.5 rounded group hover:ring-1 hover:ring-zinc-300 ${
        canModify ? 'cursor-move' : 'cursor-default'
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{
        backgroundColor,
        color: backgroundColor === "#fee090" || backgroundColor === "#e0f3f8" ? "#1a202c" : "white",
      }}
    >
      {canModify && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => onResizeStart('start', e)}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-4 h-4 rounded bg-white/90 shadow-sm border border-zinc-200">
              <GripVertical className="w-3 h-3 text-zinc-400" />
            </div>
          </div>
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => onResizeStart('end', e)}
          >
            <div className="absolute top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center w-4 h-4 rounded bg-white/90 shadow-sm border border-zinc-200">
              <GripVertical className="w-3 h-3 text-zinc-400" />
            </div>
          </div>
        </>
      )}
      <span className="truncate flex-1">
        {prefix}
        {event.title}
      </span>
      {canModify && onDelete && (
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 rounded ml-1"
          aria-label="Delete event"
          title={currentUser?.role === "admin" ? "Delete as admin" : "Delete event"}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}