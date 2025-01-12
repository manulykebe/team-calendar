import { format } from "date-fns";
import { X, Trash2 } from "lucide-react";
import { Event } from "../../types/event";

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
  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      data-tsx-id="event-details-modal"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
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
            <p className="mt-1 text-zinc-900">{event.title || ""}</p>
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

          <div className="pt-4 flex justify-end space-x-3 border-t">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
