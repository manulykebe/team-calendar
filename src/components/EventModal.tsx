import { useState, useEffect } from "react";
import { X, Calendar, User, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { createEvent, updateEvent } from "../lib/api/events";
import { getPeriods } from "../lib/api/periods";
import { Event } from "../types/event";
import { Period } from "../types/period";
import { format, addDays, subDays, isSaturday, isSunday } from "date-fns";
import toast from "react-hot-toast";
import { useTranslation } from "../context/TranslationContext";
import { useHolidays, isPublicHoliday } from "../context/HolidayContext";

interface EventModalProps {
  date: Date;
  endDate?: Date | null;
  event?: Event | null;
  onClose: () => void;
  onSubmit: (eventData: {
    title: string;
    description: string;
    date: string;
    endDate?: string;
    type: string;
    userId?: string;
    amSelected?: boolean;
    pmSelected?: boolean;
  }) => Promise<void>;
  defaultEventType?: string;
}

export function EventModal({
  date,
  endDate,
  event,
  onClose,
  onSubmit,
  defaultEventType,
}: EventModalProps) {
  const { token } = useAuth();
  const { currentUser, colleagues, refreshData } = useApp();
  const { t } = useTranslation();
  const { holidays } = useHolidays();
  
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [eventType, setEventType] = useState(event?.type || defaultEventType || "requestedPeriod");
  const [selectedUserId, setSelectedUserId] = useState(event?.userId || currentUser?.id || "");
  const [startDate, setStartDate] = useState(format(date, "yyyy-MM-dd"));
  const [eventEndDate, setEventEndDate] = useState(
    endDate ? format(endDate, "yyyy-MM-dd") : event?.endDate || ""
  );
  const [amSelected, setAmSelected] = useState(true);
  const [pmSelected, setPmSelected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);

  const isAdmin = currentUser?.role === "admin";
  const isEditing = !!event;

  // Load periods to check editing permissions
  useEffect(() => {
    const loadPeriods = async () => {
      if (!token || !currentUser) return;

      try {
        const year = new Date(startDate).getFullYear();
        const periodsData = await getPeriods(token, currentUser.site, year);
        setPeriods(periodsData.periods || []);

        // Find the period that contains the selected date
        const targetDate = new Date(startDate);
        const period = periodsData.periods?.find(p => {
          const periodStart = new Date(p.startDate);
          const periodEnd = new Date(p.endDate);
          return targetDate >= periodStart && targetDate <= periodEnd;
        });

        setCurrentPeriod(period || null);
      } catch (error) {
        console.error("Failed to load periods:", error);
      }
    };

    loadPeriods();
  }, [token, currentUser, startDate]);

  // Get available event types based on current period
  const getAvailableEventTypes = () => {
    if (!currentPeriod) {
      return []; // No event types available if no period is defined
    }

    const types = [];

    switch (currentPeriod.editingStatus) {
      case 'open-holiday':
        types.push({ value: 'requestedLeave', label: t('calendar.requestedLeave') });
        break;
      case 'open-desiderata':
        types.push({ value: 'requestedLeave', label: t('calendar.requestedLeave') });
        types.push({ value: 'requestedDesiderata', label: t('calendar.requestedDesiderata') });
        break;
      case 'closed':
      default:
        // No types available for closed periods
        break;
    }

    // Always allow period requests
    types.push({ value: 'requestedPeriod', label: t('calendar.requestedPeriod') });

    return types;
  };

  const availableEventTypes = getAvailableEventTypes();

  // Check if we can create events in this period
  const canCreateEvent = currentPeriod?.editingStatus !== 'closed' || isAdmin;

  const handleExtendToWeekends = () => {
    let newStartDate = new Date(startDate);
    let newEndDate = eventEndDate ? new Date(eventEndDate) : new Date(startDate);

    // Extend backward to include weekends and holidays
    let checkDate = subDays(newStartDate, 1);
    while (isSaturday(checkDate) || isSunday(checkDate) || isPublicHoliday(checkDate, holidays)) {
      newStartDate = checkDate;
      checkDate = subDays(checkDate, 1);
    }

    // Extend forward to include weekends and holidays
    checkDate = addDays(newEndDate, 1);
    while (isSaturday(checkDate) || isSunday(checkDate) || isPublicHoliday(checkDate, holidays)) {
      newEndDate = checkDate;
      checkDate = addDays(checkDate, 1);
    }

    setStartDate(format(newStartDate, "yyyy-MM-dd"));
    setEventEndDate(format(newEndDate, "yyyy-MM-dd"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !currentUser) return;

    // Validate that at least one time slot is selected for period requests
    if (eventType === 'requestedPeriod' && !amSelected && !pmSelected) {
      toast.error(t('events.selectAtLeastOneTimeSlot'));
      return;
    }

    setIsLoading(true);

    try {
      const eventData = {
        title,
        description,
        date: startDate,
        endDate: eventEndDate || undefined,
        type: eventType,
        userId: selectedUserId,
        amSelected,
        pmSelected,
      };

      if (isEditing && event) {
        await updateEvent(token, event.id, {
          ...eventData,
          userId: event.userId, // Keep original user for updates
        });
        toast.success(t('calendar.eventUpdated'));
      } else {
        await createEvent(token, eventData);
        toast.success(t('calendar.eventCreated'));
      }

      await refreshData();
      onClose();
    } catch (error) {
      console.error("Failed to save event:", error);
      toast.error(isEditing ? t('calendar.failedToUpdateEvent') : t('calendar.failedToCreateEvent'));
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodStatusMessage = () => {
    if (!currentPeriod) {
      return t('events.unknownStatus', { period: 'Unknown' });
    }

    switch (currentPeriod.editingStatus) {
      case 'open-holiday':
        return t('events.holidayRequestsOpen', { period: currentPeriod.name });
      case 'open-desiderata':
        return t('events.holidayDesiderataOpen', { period: currentPeriod.name });
      case 'closed':
        return t('events.periodClosed', { period: currentPeriod.name });
      default:
        return t('events.unknownStatus', { period: currentPeriod.name });
    }
  };

  const getPeriodStatusColor = () => {
    if (!currentPeriod) return "bg-gray-100 text-gray-800";

    switch (currentPeriod.editingStatus) {
      case 'open-holiday':
        return "bg-yellow-100 text-yellow-800";
      case 'open-desiderata':
        return "bg-green-100 text-green-800";
      case 'closed':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-zinc-900">
              {isEditing ? t('calendar.editEvent') : t('calendar.addEvent')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Period Status */}
          {currentPeriod && (
            <div className={`p-3 rounded-lg border ${getPeriodStatusColor()}`}>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{t('events.periodStatus')}</span>
              </div>
              <p className="text-sm mt-1">{getPeriodStatusMessage()}</p>
              {currentPeriod.editingStatus === 'open-desiderata' && (
                <p className="text-xs mt-1 opacity-75">{t('events.cascadedSystem')}</p>
              )}
            </div>
          )}

          {/* Show warning if period is closed and user is not admin */}
          {!canCreateEvent && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{t('events.periodClosedMessage')}</p>
            </div>
          )}

          {/* Event Type Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              {t('events.eventType')}
            </label>
            {availableEventTypes.length > 0 ? (
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canCreateEvent}
              >
                {availableEventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-600">{t('events.noEventTypesAvailable')}</p>
              </div>
            )}
          </div>

          {/* Admin: User Selection */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {t('events.createForColleague')}
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canCreateEvent}
              >
                <option value={currentUser?.id || ""}>
                  {currentUser?.firstName} {currentUser?.lastName} (You)
                </option>
                {colleagues
                  .filter(c => c.role !== "admin")
                  .map(colleague => (
                    <option key={colleague.id} value={colleague.id}>
                      {colleague.firstName} {colleague.lastName}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {t('events.startDate')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canCreateEvent}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {t('events.endDate')} (Optional)
              </label>
              <input
                type="date"
                value={eventEndDate}
                min={startDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canCreateEvent}
              />
            </div>
          </div>

          {/* Extend to weekends button for holiday types */}
          {(eventType === 'requestedLeave' || eventType === 'requestedDesiderata') && (
            <button
              type="button"
              onClick={handleExtendToWeekends}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              disabled={!canCreateEvent}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('events.extendPeriod')}
            </button>
          )}

          {/* Time Slots for Period Requests */}
          {eventType === 'requestedPeriod' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                {t('availability.timeSlots')}
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={amSelected}
                    onChange={(e) => setAmSelected(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    disabled={!canCreateEvent}
                  />
                  <span className="ml-2 text-sm text-zinc-700">{t('availability.am')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pmSelected}
                    onChange={(e) => setPmSelected(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    disabled={!canCreateEvent}
                  />
                  <span className="ml-2 text-sm text-zinc-700">{t('availability.pm')}</span>
                </label>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              {t('events.title')} (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('events.enterTitle', { type: '' })}
              disabled={!canCreateEvent}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              {t('events.description')} (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('events.enterDescription', { type: '' })}
              disabled={!canCreateEvent}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !canCreateEvent || availableEventTypes.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? t('events.saving') : t('events.saving')}
                </div>
              ) : (
                isEditing ? t('common.save') : t('calendar.addEvent')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}