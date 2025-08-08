import { X, Trash2, Save } from "lucide-react";
import { Event } from "../../types/event";
import { useAuth } from "../../context/AuthContext";
import { useEventOperations } from "../../hooks/useEventOperations";
import toast from "react-hot-toast";
import { useState } from "react";
import { useTranslation } from "../../context/TranslationContext";
import { formatDateWithLocale } from "../../utils/calendar";

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
  const { t, language } = useTranslation();
  const { updateEventWithUndo, deleteEventWithUndo } = useEventOperations();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);

  const handleDelete = async () => {
    if (!token) return;

    const toastId = toast.loading(t('events.deleting'));
    try {
      await deleteEventWithUndo(event);
      if (onDelete) onDelete(event.id);
      toast.success(t('calendar.eventDeleted'), { 
        id: toastId,
        duration: 6000,
        icon: '↩️'
      });
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error(t('calendar.failedToDeleteEvent'), { 
        id: toastId,
        duration: 5000 
      });
    }
  };

  const handleSave = async () => {
    if (!token) return;

    const toastId = toast.loading(t('events.saving'));
    try {
      const originalEvent = { ...event };
      const newEventData = {
        title,
        description,
      };
      
      await updateEventWithUndo(event.id, newEventData, originalEvent);
      toast.success(t('events.changesSaved'), { 
        id: toastId,
        duration: 6000,
        icon: '↩️'
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error(t('events.failedToSave'), { 
        id: toastId,
        duration: 5000 
      });
    }
  };

  const getEventTypeLabel = (eventType: string): string => {
    switch (eventType) {
      case "requestedLeave":
        return t('calendar.requestedLeave');
      case "requestedDesiderata":
        return t('calendar.requestedDesiderata');
      default:
        return eventType
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
    }
  };

  const getEventTypeColor = (eventType: string, status?: string): string => {
    // Status takes precedence over type
    if (status === 'approved') {
      return "bg-green-100 text-green-800";
    }
    if (status === 'denied') {
      return "bg-red-100 text-red-800";
    }
    
    // Default colors based on type
    switch (eventType) {
      case "requestedLeave":
        return "bg-amber-100 text-amber-800";
      case "requestedDesiderata":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Get status label for display
  const getStatusLabel = () => {
    if (!event.status || event.status === 'pending') {
      return null; // Don't show for pending
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
        event.status === 'approved' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {event.status === 'approved' ? t('events.approved') : t('events.denied')}
      </span>
    );
  };

  // Format date with localization
  const formatLocalizedDate = (date: string) => {
    return formatDateWithLocale(new Date(date), "MMMM d, yyyy", language);
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
          <h3 className="text-lg font-semibold text-zinc-900">{t('calendar.eventDetails')}</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-zinc-500 mb-1">{t('events.date')}</h4>
            <p className="text-zinc-900">
              {formatLocalizedDate(event.date)}
              {event.endDate && event.endDate !== event.date && (
                <> - {formatLocalizedDate(event.endDate)}</>
              )}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-500 mb-1">{t('events.type')}</h4>
            <div className="flex items-center">
              {getStatusLabel()}
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.type, event.status)}`}>
                {getEventTypeLabel(event.type)}
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-zinc-500 mb-1">{t('events.title')}</h4>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('events.enterTitle', { type: '' })}
              />
            ) : (
              <p className="text-zinc-900">{title || t('events.untitledEvent')}</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-500 mb-1">{t('events.description')}</h4>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={t('events.enterDescription', { type: '' })}
              />
            ) : (
              <p className="text-zinc-900 whitespace-pre-wrap">
                {description || t('events.noDescription')}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 p-4 border-t bg-zinc-50">
          {!isEditing && onDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('calendar.deleteEvent')}
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('common.save')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              >
                {t('common.edit')}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              >
                {t('common.close')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}