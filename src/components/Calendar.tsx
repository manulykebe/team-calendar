import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../lib/api";
import { EventModal } from "./EventModal";
import { SettingsPanel } from "./settings/SettingsPanel";
import { CalendarGrid } from "./calendar/CalendarGrid";
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
    selectedDate,
    currentMonth,
    showModal,
    selectedEvent,
    setSelectedDate,
    setCurrentMonth,
    setShowModal,
    setSelectedEvent,
    fetchEvents,
    handleCreateEvent,
    handleEventDelete,
    handleEventResize
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
          prev && prev.id === userId ? { ...prev, settings } : prev
        );
      };

      userSettingsEmitter.on("settingsUpdated", handleSettingsUpdate);
      return () => userSettingsEmitter.off("settingsUpdated", handleSettingsUpdate);
    }
  }, [token, fetchEvents]);

  const handlePrevWeek = () => {
    setCurrentMonth(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentMonth(prev => addWeeks(prev, 1));
  };

  const dateRange = `${format(subWeeks(currentMonth, 2), 'MMM d')} - ${format(addWeeks(currentMonth, 2), 'MMM d, yyyy')}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-zinc-900">Team Calendar</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-zinc-100 rounded-full"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-zinc-600">{dateRange}</span>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-zinc-100 rounded-full"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <CalendarGrid
          currentMonth={currentMonth}
          events={events}
          onDateClick={(date) => {
            setSelectedDate(date);
            setSelectedEvent(null);
            setShowModal(true);
          }}
          weekStartsOn={weekStartsOn}
          userSettings={currentUser?.settings}
          onEventDelete={handleEventDelete}
          currentUser={currentUser}
          onEventResize={handleEventResize}
        />
      </div>

      <SettingsPanel />

      {showModal && (
        <EventModal
          date={selectedDate}
          event={selectedEvent}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateEvent}
        />
      )}
    </div>
  );
}