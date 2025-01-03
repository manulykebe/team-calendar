import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { CalendarHeader } from './components/Calendar/CalendarHeader';
import { MonthView } from './components/Calendar/MonthView';
import { EventModal } from './components/Calendar/EventModal';
import { LoginForm } from './components/Auth/LoginForm';
import { UserManagement } from './components/Users/UserManagement';
import { ViewMode, CalendarEvent } from './types/calendar';
import eventsData from './data/events.json';

function CalendarApp() {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [showUserManagement, setShowUserManagement] = React.useState(false);

  const handlePrevious = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() - 1);
      } else if (viewMode === 'week') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() - 1);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() + 1);
      } else if (viewMode === 'week') {
        newDate.setDate(prev.getDate() + 7);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Team Calendar</h1>
          <div className="flex items-center space-x-4">
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowUserManagement(!showUserManagement)}
                className="text-gray-600 hover:text-gray-900"
              >
                Manage Users
              </button>
            )}
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {showUserManagement ? (
          <UserManagement />
        ) : (
          <div className="bg-white rounded-lg shadow">
            <CalendarHeader
              currentDate={currentDate}
              viewMode={viewMode}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onViewModeChange={setViewMode}
            />
            <MonthView
              currentDate={currentDate}
              events={eventsData.events}
              onEventClick={setSelectedEvent}
            />
          </div>
        )}
      </main>

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CalendarApp />
    </AuthProvider>
  );
}

export default App;