import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../lib/api";
import { EventModal } from "./EventModal";
import { SettingsPanel } from "./settings/SettingsPanel";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { MonthPicker } from "./calendar/MonthPicker";
import { User } from "../types/user";
import { userSettingsEmitter } from "../hooks/useColleagueSettings";
import { useCalendarSettings } from "../hooks/useCalendarSettings";
import { useCalendarState } from "../hooks/useCalendarState";
import { addWeeks, subWeeks, format } from "date-fns";

export function Calendar() {
  const { token } = useAuth();
  const { weekStartsOn } = useCalendarSettings();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const {
    events,
    selectedStartDate,
    selectedEndDate,
    hoverDate,
    currentMonth,
    showModal,
    selectedEvent,
    setCurrentMonth,
    setShowModal,
    setSelectedEvent,
    handleDateClick,
    handleDateHover,
    resetSelection,
    fetchEvents,
    handleCreateEvent,
    handleEventDelete,
    handleEventResize,
    setSelectedStartDate,
    setSelectedEndDate,
  } = useCalendarState(token);

  useEffect(() => {
    if (token) {
      Promise.all([fetchEvents(), getUsers(token)])
        .then(([_, users]) => {
          const userEmail = localStorage.getItem("userEmail");
          const user = users.find((u) => u.email === userEmail);
          if (user) {
            setCurrentUser(user);
          }
        })
        .catch(console.error);

      const handleSettingsUpdate = ({
        userId,
        settings,
      }: {
        userId: string;
        settings: any;
      }) => {
        setCurrentUser((prev) =>
          prev && prev.id === userId ? { ...prev, settings } : prev,
        );
      };

      userSettingsEmitter.on("settingsUpdated", handleSettingsUpdate);
      return () =>
        userSettingsEmitter.off("settingsUpdated", handleSettingsUpdate);
    }
  }, [token, fetchEvents]);

  const handlePrevWeek = () => {
    setCurrentMonth((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentMonth((prev) => addWeeks(prev, 1));
  };

  const handleWeekSelect = (startDate: Date, endDate: Date) => {
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    setShowModal(true);
  };

  const dateRange = `${format(subWeeks(currentMonth, 2), "MMM d")} - ${format(addWeeks(currentMonth, 2), "MMM d, yyyy")}`;

  return (
    <div
      className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-4 py-4"
      data-tsx-id="calendar"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-zinc-900">Team Calendar: AZJP</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-zinc-100 rounded-full"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-zinc-600">
              {dateRange}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-zinc-100 rounded-full"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
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

      <div className="bg-white rounded-lg shadow">
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
          defaultEventType={selectedStartDate && selectedEndDate ? "requestedHoliday" : undefined}
        />
      )}
    </div>
  );
}