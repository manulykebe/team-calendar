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
  });

  // Wrap handleDateClick to apply desiderata logic
  const handleDateClickWithDesiderata = (date: Date) => {
    // First, handle the click normally
    if (!selectedStartDate) {
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

      // Check for mandatory weekend extension
      const extension = desiderata.applyMandatoryExtension(start, end);
      if (extension && extension.extended) {
        start = extension.startDate;
        end = extension.endDate;
        toast.info(extension.reason || t('desiderata.mandatoryExtension'), { duration: 5000 });
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
        />
      )}
    </div>
  );
}