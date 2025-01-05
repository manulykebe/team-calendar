import { Trash2 } from "lucide-react";
import { User } from "../../types/user";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    userId: string;
  };
  userSettings?: User["settings"];
  onDelete?: (eventId: string) => void;
  currentUser?: User | null;
}

export function EventCard({
  event,
  userSettings,
  onDelete,
  currentUser,
}: EventCardProps) {
  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || "#e2e8f0";
  const prefix = colleagueSettings?.initials
    ? `[${colleagueSettings.initials}] `
    : "";

  // Allow deletion if user is admin or owns the event
  const canDelete = currentUser && (currentUser.role === "admin" || currentUser.id === event.userId);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onDelete && canDelete) {
      onDelete(event.id);
    }
  };

  return (
    <div
      className="flex items-center justify-between text-xs px-1 py-0.5 rounded group hover:ring-1 hover:ring-zinc-300"
      style={{
        backgroundColor,
        color:
          backgroundColor === "#fee090" || backgroundColor === "#e0f3f8"
            ? "#1a202c"
            : "white",
      }}
    >
      <span className="truncate flex-1">
        {prefix}
        {event.title}
      </span>
      {canDelete && onDelete && (
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