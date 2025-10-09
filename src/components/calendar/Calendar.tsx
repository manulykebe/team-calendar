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
import { ConnectionStatus } from "./common/ConnectionStatus";
import { useCalendarState } from "../hooks/useCalendarState";
import { useCalendarScroll } from "../hooks/useCalendarScroll";
import { useApp } from "../context/AppContext";
import { useTranslation } from "../context/TranslationContext";
import {
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  format,
  startOfWeek,
  isSameWeek,
  getYear
} from "date-fns";
import { useEffect, useRef } from "react";

export function Calendar() {
  const { currentUser, events, availabilityData, isLoading: isLoadingAvailability, loadAvailabilityForYear } = useApp();
  const { t } = useTranslation();
  const previousYearRef = useRef<number | null>(null);
  
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

  // Use the calendar scroll hook
  const { containerRef } = useCalendarScroll({
    currentMonth,
    setCurrentMonth,
  });

  // Load availability data when the year changes
  useEffect(() => {
    const currentYear = getYear(currentMonth);

    // Only load if this is a different year than before
    if (previousYearRef.current !== currentYear) {
      previousYearRef.current = currentYear;
      loadAvailabilityForYear(currentYear);
    }
  }, [currentMonth, loadAvailabilityForYear]);

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
      <ConnectionStatus />
      
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
          onDateClick={handleDateClick}
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
    </div>
  );
}