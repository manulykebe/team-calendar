import { useState, useEffect } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getEvents, createEvent } from '../../lib/api';
import { EventModal } from '../EventModal';
import { UserManagement } from '../users/UserManagement';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';

export function Calendar() {
  const { token, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (token) {
      loadEvents();
    }
  }, [token, currentDate]);

  const loadEvents = async () => {
    try {
      const data = await getEvents(token!);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Calendar</h1>
        <div className="flex items-center space-x-4">
          <UserManagement />
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
        <CalendarGrid
          currentDate={currentDate}
          events={events}
          onDateClick={setSelectedDate}
        />
      </div>

      {selectedDate && (
        <EventModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSubmit={async (data) => {
            try {
              await createEvent(token!, { ...data, date: format(selectedDate, 'yyyy-MM-dd') });
              await loadEvents();
              setSelectedDate(null);
            } catch (error) {
              console.error('Failed to create event:', error);
            }
          }}
        />
      )}
    </div>
  );
}