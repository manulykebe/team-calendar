import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../lib/api";
import { EventModal } from "./EventModal";
import { UserManagement } from "./users/UserManagement";
import { SettingsPanel } from "./settings/SettingsPanel";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { User } from "../types/user";
import { userSettingsEmitter } from "../hooks/useColleagueSettings";
import { useCalendarSettings } from "../hooks/useCalendarSettings";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useCalendarState } from "../hooks/useCalendarState";

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
    handleEventMove
  } = useCalendarState(token);

  const { 
    draggedEvent, 
    dragOverDate, 
    handleDragStart, 
    handleDragOver, 
    handleDrop 
  } = useDragAndDrop(handleEventMove);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Team Calendar</h1>
        <UserManagement />
        <SettingsPanel />
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
          draggedEvent={draggedEvent}
          dragOverDate={dragOverDate}
          onEventDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
        />
      </div>

      <button
        onClick={() => {
          setSelectedDate(new Date());
          setShowModal(true);
        }}
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"
      >
        <Plus className="w-6 h-6" />
      </button>

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