import {
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  CalendarIcon,
} from "lucide-react";
import { EventModal } from "./EventModal";
import { SettingsPanel } from "./settings/SettingsPanel";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { MonthPicker } from "./calendar/MonthPicker";
import { DesiderataAvailabilityPanel } from "./calendar/DesiderataAvailabilityPanel";
import { useCalendarState } from "../hooks/useCalendarState";
import { useCalendarScroll } from "../hooks/useCalendarScroll";
import { useDesiderataSelection } from "../hooks/useDesiderataSelection";
import { useApp } from "../context/AppContext";
import { useTranslation } from "../context/TranslationContext";
import { useHolidays } from "../context/HolidayContext";
import toast from "react-hot-toast";
import {
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  format,
  startOfWeek,
  isSameWeek,
  getYear,
  addDays,
  parseISO
} from "date-fns";
import { useEffect } from "react";

export function Calendar() {
  console.log('[Calendar] Component rendering');

  const { currentUser, events, availabilityData, periods, isLoading: isLoadingAvailability, loadAvailabilityForYear, loadPeriodsForYear } = useApp();
  const { t } = useTranslation();
  const { holidays } = useHolidays();

  console.log('[Calendar] currentUser:', currentUser?.id);
  console.log('[Calendar] loadAvailabilityForYear:', typeof loadAvailabilityForYear);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {t('errors.somethingWentWrong')}
      </div>
    );
  }
  
  const weekStartsOn = currentUser?.app?.weekStartsOn || "Monday";

  const {
    selectedStartDate,
    selectedEndDate,
    hoverDate,
    currentMonth,
    showModal,
    selectedEvent,
    setCurrentMonth,
    setShowModal,
    handleDateClick,
    handleDateHover,
    resetSelection,
    handleCreateEvent,
    handleEventDelete,
    handleEventResize,
    setSelectedStartDate,
    setSelectedEndDate,
  } = useCalendarState();

  // Use desiderata selection hook
  const desiderata = useDesiderataSelection({
    periods,
    holidays,
    userPriority: currentUser?.priority || 2,
    events,
    currentUserId: currentUser.id,
  });

  // Helper to check if date is a public holiday
  const isHoliday = (date: Date): boolean => {
    return holidays.some(h => h.date === date.toISOString().split('T')[0]);
  };

  // Helper to check auto-extension for a single date
  const checkAutoExtension = (date: Date): { extend: boolean; startDate?: Date; endDate?: Date; reason?: string } => {
    const dayOfWeek = date.getDay();

    // Saturday or Sunday -> extend backward to Friday
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      const daysToFriday = dayOfWeek === 6 ? 1 : 2;
      return {
        extend: true,
        startDate: subDays(date, daysToFriday),
        endDate: date,
        reason: t('desiderata.autoExtendedToWeekend') || 'Selected weekend day - automatically including Friday',
      };
    }

    // If it's a Friday, extend to Sunday
    if (dayOfWeek === 5) {
      return {
        extend: true,
        startDate: date,
        endDate: addDays(date, 2),
        reason: t('desiderata.autoExtendedToWeekend') || 'Selected Friday - automatically extending to Sunday',
      };
    }

    // If it's Thursday and next day (Friday) is a holiday, extend to Sunday
    if (dayOfWeek === 4) {
      const nextDay = addDays(date, 1);
      if (isHoliday(nextDay)) {
        return {
          extend: true,
          startDate: date,
          endDate: addDays(date, 3),
          reason: t('desiderata.mandatoryExtension') || 'Thursday before bank holiday Friday - extending to Sunday',
        };
      }
    }

    return { extend: false };
  };

  // Helper to check if a date range needs extension due to adjacent holidays
  const checkRangeExtension = (start: Date, end: Date): { extend: boolean; newStart: Date; newEnd: Date; reason?: string } => {
    let newStart = start;
    let newEnd = end;
    let extended = false;
    const reasons: string[] = [];

    // Check if range starts on weekend - extend backward to Friday
    const startDay = start.getDay();
    if (startDay === 6 || startDay === 0) {
      const daysToFriday = startDay === 6 ? 1 : 2;
      newStart = subDays(start, daysToFriday);
      extended = true;
      reasons.push('Range starts on weekend - including Friday');
    }

    // Check if range ends on weekend - already should be Sunday, but check Friday
    const endDay = end.getDay();
    if (endDay === 5 || endDay === 6) {
      newEnd = addDays(end, endDay === 5 ? 2 : 1); // Extend to Sunday
      extended = true;
      reasons.push('Range ends on Friday/Saturday - extending to Sunday');
    }

    // Check if Thursday before range start is a holiday
    const dayBeforeStart = subDays(newStart, 1);
    if (dayBeforeStart.getDay() === 4 && isHoliday(dayBeforeStart)) {
      newStart = dayBeforeStart;
      extended = true;
      reasons.push('Thursday before period is a holiday - including in range');
    }

    // Check if Monday after range end is a holiday
    const dayAfterEnd = addDays(newEnd, 1);
    if (dayAfterEnd.getDay() === 1 && isHoliday(dayAfterEnd)) {
      newEnd = dayAfterEnd;
      extended = true;
      reasons.push('Monday after period is a holiday - including in range');
    }

    // Check if Tuesday after range end is a holiday (include Monday as well)
    const twoDaysAfterEnd = addDays(newEnd, 2);
    if (twoDaysAfterEnd.getDay() === 2 && isHoliday(twoDaysAfterEnd)) {
      newEnd = twoDaysAfterEnd;
      extended = true;
      reasons.push('Tuesday after period is a holiday - including Monday and Tuesday');
    }

    return {
      extend: extended,
      newStart,
      newEnd,
      reason: reasons.join('; '),
    };
  };

  // Wrap handleDateClick to apply desiderata logic
  const handleDateClickWithDesiderata = (date: Date) => {
    // First, handle the click normally
    if (!selectedStartDate) {
      // Check if this single date should auto-extend
      const extension = checkAutoExtension(date);
      if (extension.extend && extension.startDate && extension.endDate) {
        setSelectedStartDate(extension.startDate);
        setSelectedEndDate(extension.endDate);
        desiderata.updateCurrentSelection(extension.startDate, extension.endDate);
        setShowModal(true);
        toast.info(extension.reason || t('desiderata.mandatoryExtension'), { duration: 5000 });
        return;
      }
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      desiderata.updateCurrentSelection(date, null);
    } else if (!selectedEndDate) {
      let start = selectedStartDate;
      let end = date;

      if (date < selectedStartDate) {
        start = date;
        end = selectedStartDate;
      }

      // Check for range extension (weekends and adjacent holidays)
      const rangeExtension = checkRangeExtension(start, end);
      if (rangeExtension.extend) {
        start = rangeExtension.newStart;
        end = rangeExtension.newEnd;
        toast.info(rangeExtension.reason || t('desiderata.mandatoryExtension'), { duration: 5000 });
      }

      // Validate selection
      const validation = desiderata.validateNewSelection(start, end);
      if (validation && !validation.isValid) {
        toast.error(validation.errors.join('; '), { duration: 5000 });
        return;
      }

      if (validation?.warnings.length) {
        toast.warning(validation.warnings.join('; '), { duration: 4000 });
      }

      setSelectedStartDate(start);
      setSelectedEndDate(end);
      desiderata.updateCurrentSelection(start, end);
      setShowModal(true);
    } else {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      desiderata.updateCurrentSelection(date, null);
    }
  };

  // Use the calendar scroll hook
  const { containerRef } = useCalendarScroll({
    currentMonth,
    setCurrentMonth,
  });

  // Load availability data for all visible years (calendar shows 5 weeks which can span years)
  useEffect(() => {
    // Calculate the visible date range (same as calendar display logic)
    const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
    const calendarStart = subWeeks(weekStart, 1); // 1 week before
    const calendarEnd = addDays(addWeeks(weekStart, 3), 6); // 3 weeks after + 6 days

    console.log(`[Calendar] Current month changed to:`, format(currentMonth, 'MMM yyyy'));
    console.log(`[Calendar] Visible range:`, format(calendarStart, 'yyyy-MM-dd'), 'to', format(calendarEnd, 'yyyy-MM-dd'));

    // Extract unique years from the visible range
    const startYear = getYear(calendarStart);
    const endYear = getYear(calendarEnd);

    const visibleYears = new Set<number>();
    visibleYears.add(startYear);
    if (endYear !== startYear) {
      visibleYears.add(endYear);
    }

    console.log(`[Calendar] Visible years:`, Array.from(visibleYears));

    // Load availability and periods for all visible years
    visibleYears.forEach(year => {
      console.log(`[Calendar] Triggering load for year:`, year);
      loadAvailabilityForYear(year);
      loadPeriodsForYear(year);
    });
  }, [currentMonth, loadAvailabilityForYear, loadPeriodsForYear]);

  const handleToday = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
    
    // If today is already in the current visible range, no need to change
    if (!isSameWeek(currentMonth, today, { weekStartsOn: 1 })) {
      setCurrentMonth(weekStart);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handlePrevWeek = () => {
    setCurrentMonth((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentMonth((prev) => addWeeks(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleWeekSelect = (startDate: Date, endDate: Date) => {
    const alignedStartDate = startOfWeek(startDate, { weekStartsOn: 1 });
    setSelectedStartDate(alignedStartDate);
    setSelectedEndDate(endDate);
    setShowModal(true);
  };

  // Calculate the date range for display
  const startDisplayDate = subWeeks(startOfWeek(currentMonth, { weekStartsOn: 1 }), 1);
  const endDisplayDate = subDays(addWeeks(startOfWeek(currentMonth, { weekStartsOn: 1 }), 3 + 1), 1);
  const dateRange = `${format(startDisplayDate, "MMM d")} - ${format(endDisplayDate, "MMM d, yyyy")}`;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-4 py-4" data-tsx-id="calendar">
      
      
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-4">
          <div className="flex justify-between items-center">
            <div className="w-80 flex-1 items-center space-x-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleToday}
                    className="flex items-center px-2 py-1 space-x-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                    title={t('calendar.goToToday')}
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePrevMonth}
                    className="hover:bg-zinc-100 rounded-full"
                    aria-label={t('calendar.previousMonth')}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePrevWeek}
                    className="hover:bg-zinc-100 rounded-full"
                    aria-label={t('calendar.previousWeek')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm font-medium text-zinc-600">
                  {dateRange}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleNextWeek}
                    className="hover:bg-zinc-100 rounded-full"
                    aria-label={t('calendar.nextWeek')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="hover:bg-zinc-100 rounded-full"
                    aria-label={t('calendar.nextMonth')}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <MonthPicker
            currentMonth={currentMonth}
            onDateSelect={setCurrentMonth}
            weekStartsOn={weekStartsOn}
          />
        </div>
      </div>

      <div 
        ref={containerRef}
        className="bg-white rounded-lg shadow overflow-hidden"
      >
        <CalendarGrid
          currentMonth={currentMonth}
          events={events}
          onDateClick={handleDateClickWithDesiderata}
          onDateHover={handleDateHover}
          weekStartsOn={weekStartsOn}
          userSettings={currentUser?.settings}
          onEventDelete={handleEventDelete}
          currentUser={currentUser}
          onEventResize={handleEventResize}
          selectedStartDate={selectedStartDate}
          selectedEndDate={selectedEndDate}
          hoverDate={hoverDate}
          onWeekSelect={handleWeekSelect}
          availabilityData={availabilityData}
          isLoadingAvailability={isLoadingAvailability}
          periods={periods}
        />
      </div>

      <SettingsPanel />

      {showModal && (
        <EventModal
          date={selectedStartDate!}
          endDate={selectedEndDate}
          event={selectedEvent}
          onClose={() => {
            setShowModal(false);
            resetSelection();
          }}
          onSubmit={handleCreateEvent}
          defaultEventType={
            selectedStartDate && selectedEndDate
              ? "requestedLeave"
              : undefined
          }
        />
      )}

      {desiderata.shouldShowPanel && desiderata.availability && desiderata.limits && desiderata.activePeriod && (
        <DesiderataAvailabilityPanel
          availability={desiderata.availability}
          limits={desiderata.limits}
          currentSelection={desiderata.currentSelection}
          existingSelections={desiderata.existingSelections}
          periodName={`${format(parseISO(desiderata.activePeriod.startDate), 'MMM d')} - ${format(parseISO(desiderata.activePeriod.endDate), 'MMM d, yyyy')}`}
          isVisible={true}
          onClose={desiderata.hidePanel}
        />
      )}
    </div>
  );
}