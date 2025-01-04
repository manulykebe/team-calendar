import { useState } from 'react';
import { format } from 'date-fns';
import { LogOut, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EventModal } from '../EventModal';
import { UserManagement } from '../users/UserManagement';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

export function Calendar() {
  const { token, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { events, isLoading, error, createNewEvent } = useCalendarEvents();

  const handleCreateEvent = async (eventData: { title: string; description: string }) => {
    if (!selectedDate) return;

    try {
      await createNewEvent({
        ...eventData,
        date: format(selectedDate, 'yyyy-MM-dd')
      });
      setSelectedDate(null);
    } catch (error) {
      console.error('Event creation error:', error);
      throw error;
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

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

      <div className="bg-white rounded-lg shadow">
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={() => setCurrentDate(prev => new Date(prev.setMonth(prev.getMonth() - 1)))}
          onNextMonth={() => setCurrentDate(prev => new Date(prev.setMonth(prev.getMonth() + 1)))}
        />
        <CalendarGrid
          currentDate={currentDate}
          events={events}
          isLoading={isLoading}
          onDateClick={setSelectedDate}
        />
      </div>

      <button
        onClick={() => setSelectedDate(new Date())}
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Add event"
      >
        <Plus className="w-6 h-6" />
      </button>

      {selectedDate && (
        <EventModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSubmit={handleCreateEvent}
        />
      )}
    </div>
  );
}