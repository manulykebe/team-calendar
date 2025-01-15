import { format } from "date-fns";
import { X, Trash2 } from "lucide-react";
import { Event } from "../../types/event";
import toast from "react-hot-toast";

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onDelete?: (eventId: string) => void;
}

export function EventDetailsModal({
  event,
  onClose,
  onDelete,
}: EventDetailsModalProps) {
  const handleDelete = async () => {
    if (!onDelete) return;

    const toastId = toast.loading('Deleting event...');
    try {
      await onDelete(event.id);
      toast.success('Event deleted successfully', { id: toastId });
      onClose();
    } catch (error) {
      toast.error('Failed to delete event', { id: toastId });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-tsx-id="event-details-modal"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-zinc-900">Event Details</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-zinc-500">Title</h4>
            <p className="mt-1 text-zinc-900">{event.title || "Untitled Event"}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-500">Date</h4>
            <p className="mt-1 text-zinc-900">
              {format(new Date(event.date), "MMMM d, yyyy")}
              {event.endDate && (
                <> - {format(new Date(event.endDate), "MMMM d, yyyy")}</>
              )}
            </p>
          </div>

          {event.description && (
            <div>
              <h4 className="text-sm font-medium text-zinc-500">Description</h4>
              <p className="mt-1 text-zinc-900 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-zinc-500">Type</h4>
            <p className="mt-1 text-zinc-900">
              {event.type
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </p>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 p-4 border-t bg-zinc-50">
          {onDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Event
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}