import { useState, useEffect } from "react";
import { X, Calendar, Check, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { createEvent } from "../../lib/api";
import { format } from "date-fns";
import { useTranslation } from "../../context/TranslationContext";
import toast from "react-hot-toast";

interface AdminEventCreationModalProps {
  date: Date;
  endDate?: Date | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminEventCreationModal({
  date,
  endDate,
  onClose,
  onSuccess,
}: AdminEventCreationModalProps) {
  const { token } = useAuth();
  const { colleagues } = useApp();
  const { t } = useTranslation();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("requestedHoliday");
  const [selectedColleagueId, setSelectedColleagueId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Set default event type
  useEffect(() => {
    if (endDate) {
      setType("requestedHoliday");
    } else {
      setType("requestedPeriod");
    }
  }, [endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedColleagueId) {
      setError(t('users.selectColleague'));
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    const toastId = toast.loading(t('common.saving'));
    
    try {
      const eventData = {
        title,
        description,
        date: format(date, "yyyy-MM-dd"),
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        type,
        userId: selectedColleagueId, // Include the selected colleague's ID
        status: "approved" // Admin-created events are automatically approved
      };
      
      await createEvent(token!, eventData);
      
      toast.success(t('calendar.eventCreated'), { id: toastId });
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.somethingWentWrong');
      setError(errorMessage);
      toast.error(t('calendar.failedToCreateEvent'), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventTypeLabel = (eventType: string): string => {
    switch (eventType) {
      case "requestedHoliday":
        return t('calendar.requestedHoliday');
      case "requestedHolidayMandatory":
        return t('calendar.requestedHoliday') + " (Mandatory)";
      case "requestedDesiderata":
        return t('calendar.requestedDesiderata');
      case "requestedPeriod":
        return t('calendar.requestedPeriod');
      default:
        return eventType
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-zinc-900">
              {t('calendar.addEvent')} - {format(date, "MMMM d, yyyy")}
              {endDate && ` to ${format(endDate, "MMMM d, yyyy")}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="colleague" className="block text-sm font-medium text-zinc-700 mb-1">
              {t('users.selectColleague')} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-zinc-400" />
              </div>
              <select
                id="colleague"
                value={selectedColleagueId}
                onChange={(e) => setSelectedColleagueId(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
                aria-required="true"
              >
                <option value="">{t('users.selectColleague')}</option>
                {colleagues.map((colleague) => (
                  <option key={colleague.id} value={colleague.id}>
                    {colleague.firstName} {colleague.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-zinc-700 mb-1">
              {t('events.eventType')} *
            </label>
            <select
              id="eventType"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="block w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            >
              <option value="requestedHoliday">{getEventTypeLabel("requestedHoliday")}</option>
              <option value="requestedHolidayMandatory">{getEventTypeLabel("requestedHolidayMandatory")}</option>
              <option value="requestedPeriod">{getEventTypeLabel("requestedPeriod")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
              {t('events.title')}
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder={t('events.enterTitle', { type: getEventTypeLabel(type).toLowerCase() })}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
              {t('events.description')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder={t('events.enterDescription', { type: getEventTypeLabel(type).toLowerCase() })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}