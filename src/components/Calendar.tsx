import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Plus, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getEvents, createEvent, getUsers } from "../lib/api";
import { EventModal } from "./EventModal";
import { UserManagement } from "./users/UserManagement";
import { SettingsPanel } from "./settings/SettingsPanel";
import { EventCard } from "./calendar/EventCard";
import { User } from "../types/user";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  userId: string;
}

export function Calendar() {
  const { token, logout } = useAuth(); // Added logout from useAuth
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      // Fetch events
      getEvents(token).then(setEvents).catch(console.error);
      
      // Fetch current user for settings
      getUsers(token).then(users => {
        const userEmail = localStorage.getItem('userEmail');
        const user = users.find(u => u.email === userEmail);
        if (user) {
          setCurrentUser(user);
        }
      }).catch(console.error);
    }
  }, [token]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
  }) => {
    if (!token) return;

    try {
      const newEvent = await createEvent(token, {
        ...eventData,
        date: format(selectedDate, "yyyy-MM-dd"),
      });
      setEvents([...events, newEvent]);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Calendar</h1>
        <UserManagement />
        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
          <SettingsPanel />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
                )
              }
              className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
                )
              }
              className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day) => {
            const dayEvents = events.filter(
              (event) => event.date === format(day, "yyyy-MM-dd")
            );

            return (
              <div
                key={day.toString()}
                className="min-h-[120px] bg-white p-2"
                onClick={() => {
                  setSelectedDate(day);
                  setShowModal(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-700">
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      userSettings={currentUser?.settings}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateEvent}
        />
      )}
    </div>
  );
}