import { format } from "date-fns";
import { X, Trash2, Save } from "lucide-react";
import { Event } from "../../types/event";
import { useAuth } from "../../context/AuthContext";
import { deleteEvent, updateEvent } from "../../lib/api";
import toast from "react-hot-toast";
import { useState } from "react";

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
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);

  const handleDelete = async () => {
    if (!token || !onDelete) return;

    const toastId = toast.loading('Deleting event...');
    try {
      await deleteEvent(token, event.id);
      onDelete(event.id);
      toast.success('Event deleted successfully', { id: toastId });
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event', { id: toastId });
    }
  };

  const handleSave = async () => {
    if (!token) return;

    const toastId = toast.loading('Saving changes...');
    try {
      await updateEvent(token, event.id, {
        ...event,
        title,
        description,
      });
      toast.success('Changes saved successfully', { id: toastId });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes', { id: toastId });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
            <h4 className="text-sm font-medium text-zinc-500 mb-1">Date</h4>
            <p className="text-zinc-900">
              {format(new Date(event.date), "MMMM d, yyyy")}
              {event.endDate && (
                <> - {format(new Date(event.endDate), "MMMM d, yyyy")}</>
              )}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-zinc-500 mb-1">Title</h4>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter title"
              />
            ) : (
              <p className="text-zinc-900">{title || "Untitled Event"}</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-500 mb-1">Description</h4>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter description"
              />
            ) : (
              <p className="text-zinc-900 whitespace-pre-wrap">
                {description || "No description"}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-500 mb-1">Type</h4>
            <p className="text-zinc-900">
              {event.type
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </p>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 p-4 border-t bg-zinc-50">
          {!isEditing && onDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Event
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTitle(event.title);
                  setDescription(event.description);
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}