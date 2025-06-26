import { useState, useRef, useEffect } from 'react';
import { Calendar, Trash2, Edit3, X } from 'lucide-react';
import { Event } from '../../types/event';
import { User } from '../../types/user';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { updateEvent, deleteEvent } from '../../lib/api';
import { getHolidays } from '../../lib/api/holidays';
import toast from 'react-hot-toast';
import { format, addDays, subDays, parseISO, isWeekend, isSaturday, isSunday, isValid } from 'date-fns';
import { useClickOutside } from '../../hooks/useClickOutside';

interface EventContextMenuProps {
  event: Event;
  eventOwner: User | null;
  position: { x: number; y: number };
  onClose: () => void;
  onUpdate: () => void;
}

export function EventContextMenu({
  event,
  eventOwner,
  position,
  onClose,
  onUpdate
}: EventContextMenuProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDateModifier, setShowDateModifier] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [startDate, setStartDate] = useState(event.date);
  const [endDate, setEndDate] = useState(event.endDate || event.date);
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuPosition, setMenuPosition] = useState(position);
  const [holidays, setHolidays] = useState<string[]>([]);

  // Fetch holidays when component mounts
  useEffect(() => {
    const fetchHolidays = async () => {
      if (!token || !eventOwner) return;
      
      try {
        const year = new Date(event.date).getFullYear();
        const holidayData = await getHolidays(year.toString(), eventOwner.site === 'london' ? 'GB' : 'BE');
        
        // Extract holiday dates
        const holidayDates = holidayData.map(holiday => holiday.date);
        setHolidays(holidayDates);
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };
    
    fetchHolidays();
  }, [token, event.date, eventOwner]);

  // Adjust menu position to ensure it's fully visible on screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Check if menu extends beyond right edge of viewport
      if (position.x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 10; // 10px padding
      }

      // Check if menu extends beyond bottom edge of viewport
      if (position.y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 10; // 10px padding
      }

      // Ensure menu doesn't go off the left or top edge
      newX = Math.max(10, newX);
      newY = Math.max(10, newY);

      setMenuPosition({ x: newX, y: newY });
    }
  }, [position, showDateModifier, showDeleteConfirm]);

  // Close menu when clicking outside
  useClickOutside(menuRef, onClose);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Calculate if this is a holiday-type event
  const isHolidayType = event.type === 'requestedHoliday' || event.type === 'requestedHolidayMandatory';

  // Check if a date is a public holiday
  const isPublicHoliday = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.includes(dateStr);
  };

  // Handle date modification
  const handleDateModification = async () => {
    if (!token) return;

    // Validate dates
    if (!isValid(parseISO(startDate)) || !isValid(parseISO(endDate))) {
      toast.error(t('errors.validationError'));
      return;
    }

    setIsUpdating(true);
    const toastId = toast.loading(t('events.saving'));

    try {
      await updateEvent(token, event.id, {
        ...event,
        date: startDate,
        endDate: endDate,
        userId: event.userId
      });

      toast.success(t('events.changesSaved'), { id: toastId });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update event dates:', error);
      toast.error(t('events.failedToSave'), { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!token) return;

    setIsUpdating(true);
    const toastId = toast.loading(t('common.deleting'));

    try {
      // For admin users, we need to pass the event's userId to properly delete it
      // This is because admins can delete events that belong to other users
      await deleteEvent(token, event.id);
      toast.success(t('calendar.eventDeleted'), { id: toastId });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error(t('calendar.failedToDeleteEvent'), { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle extending period to include weekends and public holidays
  const handleExtendPeriod = () => {
    try {
      const startDateObj = parseISO(startDate);
      const endDateObj = parseISO(endDate);

      if (!isValid(startDateObj) || !isValid(endDateObj)) {
        toast.error(t('errors.validationError'));
        return;
      }

      // Find the nearest weekend days and public holidays
      let newStartDate = startDateObj;
      let newEndDate = endDateObj;

      // Extend start date backward
      let currentDate = subDays(newStartDate, 1);
      while (isSaturday(currentDate) || isSunday(currentDate) || isPublicHoliday(currentDate)) {
        newStartDate = currentDate;
        currentDate = subDays(currentDate, 1);
      }

      // Extend end date forward
      currentDate = addDays(newEndDate, 1);
      while (isSaturday(currentDate) || isSunday(currentDate) || isPublicHoliday(currentDate)) {
        newEndDate = currentDate;
        currentDate = addDays(currentDate, 1);
      }

      // Update state with new dates
      setStartDate(format(newStartDate, 'yyyy-MM-dd'));
      setEndDate(format(newEndDate, 'yyyy-MM-dd'));
    } catch (error) {
      console.error('Error extending period:', error);
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  // Get event type label
  const getEventTypeLabel = (eventType: string, eventStatus?: string): string => {
    switch (eventType) {
      case "requestedHoliday":
        switch (eventStatus) {
          case "approved":
            return t('calendar.approvedHoliday');
          case "denied":
            return t('calendar.deniedHoliday');
          case "pending":
            return t('calendar.pendingHoliday');
          default:
            return t('calendar.requestedHoliday');
        }
      case "requestedHolidayMandatory":
        return t('calendar.requestedHoliday');
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
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-zinc-200 overflow-hidden"
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
        minWidth: '240px',
        maxWidth: '320px'
      }}
    >
      {/* Header */}
      <div className="bg-zinc-50 px-3 py-2 border-b border-zinc-200 flex justify-between items-center">
        <div className="font-medium text-zinc-800 truncate">
          {getEventTypeLabel(event.type, event.status)}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main content */}
      {!showDateModifier && !showDeleteConfirm && (
        <div className="p-2">
          <div className="text-xs text-zinc-500 mb-2">
            {eventOwner ? `${eventOwner.firstName} ${eventOwner.lastName}` : t('users.unknownUser')}
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setShowDateModifier(true)}
              className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-md flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2 text-blue-600" />
              {t('events.modifyDates')}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-md flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2 text-red-600" />
              {t('common.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Date Modifier */}
      {showDateModifier && (
        <div className="p-3 space-y-3">
          <h3 className="text-sm font-medium text-zinc-800">{t('events.modifyDates')}</h3>

          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                {t('events.startDate')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                {t('events.endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {isHolidayType && (
              <button
                onClick={handleExtendPeriod}
                className="w-full text-left px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t('events.extendPeriod')}
              </button>
            )}

            <div className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded">
              {t('events.dateModificationNote')}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setShowDateModifier(false)}
              className="px-3 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              disabled={isUpdating}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDateModification}
              disabled={isUpdating}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-red-100">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>

          <h3 className="text-sm font-medium text-center text-zinc-800">
            {t('events.confirmDelete')}
          </h3>

          <p className="text-xs text-zinc-600 text-center">
            {t('events.deleteWarning')}
          </p>

          <div className="bg-zinc-50 p-2 rounded text-xs">
            <div className="font-medium">{getEventTypeLabel(event.type, event.status)}</div>
            <div>{format(parseISO(event.date), 'MMM d, yyyy')}
              {event.endDate && event.endDate !== event.date &&
                ` - ${format(parseISO(event.endDate), 'MMM d, yyyy')}`}
            </div>
            {event.title && <div className="truncate">{event.title}</div>}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              disabled={isUpdating}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDeleteEvent}
              disabled={isUpdating}
              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isUpdating ? t('common.deleting') : t('common.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}