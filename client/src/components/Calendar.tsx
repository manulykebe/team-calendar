import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EventClickArg } from '@fullcalendar/core';
import api from '../api/axios';
import { isAxiosError } from 'axios';

interface Event {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  status: string;
  private: boolean;
  color?: string;
  className?: string;
  allDay?: boolean;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<Event>) => void;
  startDate: Date;
  endDate: Date;
  isTeamMember: boolean;
  event?: Event;
}

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  startDate, 
  endDate, 
  isTeamMember,
  event 
}) => {
  const [title, setTitle] = useState(event?.title || '');
  const [status, setStatus] = useState<Event['status']>(event?.status || 'desired');
  const [isPrivate, setIsPrivate] = useState(event?.private || false);
  const [timeSlot, setTimeSlot] = useState<'full' | 'morning' | 'afternoon'>('full');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setStatus(event.status);
      setIsPrivate(event.private);
      
      // Determine time slot from event times
      const start = new Date(event.start);
      const end = new Date(event.end);
      if (start.getHours() === 7 && end.getHours() === 12) {
        setTimeSlot('morning');
      } else if (start.getHours() === 12 && end.getHours() === 17) {
        setTimeSlot('afternoon');
      } else {
        setTimeSlot('full');
      }
    }
  }, [event]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let eventStart = new Date(startDate);
    let eventEnd = new Date(startDate);

    if (status === 'desired') {
      switch (timeSlot) {
        case 'morning':
          eventStart.setHours(7, 0, 0);
          eventEnd.setHours(12, 0, 0);
          break;
        case 'afternoon':
          eventStart.setHours(12, 0, 0);
          eventEnd.setHours(17, 0, 0);
          break;
        case 'full':
          eventStart.setHours(0, 0, 0);
          eventEnd.setHours(23, 59, 59);
          break;
      }
    } else {
      eventStart = startDate;
      eventEnd = endDate;
    }

    onSave({
      title,
      status,
      private: isPrivate,
      start: eventStart,
      end: eventEnd,
      color: status === 'unavailable' ? '#EF4444' : status === 'desired' ? undefined : '#10B981',
      className: status === 'desired' ? 'desired-event' : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {event ? 'Update Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Holiday Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Event['status'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="available">Available</option>
              <option value="desired">Desired</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          
          {status === 'desired' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as 'full' | 'morning' | 'afternoon')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="full">Whole Day</option>
                <option value="morning">Morning (07:00 - 12:00)</option>
                <option value="afternoon">Afternoon (12:00 - 17:00)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Personal Remark
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="private" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Private Event
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {event ? 'Update Event' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

const SaveNotification: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span>Saving changes...</span>
    </div>
  );
};

// Rename calendarApi to serverApi to avoid confusion
const serverApi = {
  async createEvent(site: string, year: string, event: Partial<Event>) {
    const response = await api.post(`/api/sites/${site}/events/${year}`, event);
    return response.data;
  },

  async updateEvent(site: string, year: string, eventId: string, event: Partial<Event>) {
    const response = await api.put(`/api/sites/${site}/events/${year}/${eventId}`, event);
    return response.data;
  },

  async deleteEvent(site: string, year: string, eventId: string) {
    await api.delete(`/api/sites/${site}/events/${year}/${eventId}`);
  },

  async getEvents(site: string, year: string) {
    const response = await api.get(`/api/sites/${site}/events/${year}`);
    return response.data.events;
  },

  async getBankHolidays(country: string, year: string) {
    const response = await api.get(`/api/bank-holidays/${country}/${year}`);
    return response.data.holidays;
  }
};

export const Calendar: React.FC = () => {
  const { user } = useAuth();
  const isTeamMember = user?.roles.includes('team-member') ?? false;
  const [view, setView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'multiMonthYear'>(
    isTeamMember ? 'dayGridMonth' : 'timeGridWeek'
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [events, setEvents] = useState<Event[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!user) return;
        
        const site = user.sites[0] || 'main';
        const currentYear = new Date().getFullYear();
        
        // Fetch user events
        const { data: eventsData } = await api.get(`/api/sites/${site}/events/${currentYear}`);
        
        // Fetch bank holidays - normalize country case
        const country = (user.country || 'belgium').toLowerCase();
        const { data: holidaysData } = await api.get(`/api/bank-holidays/${country}/${currentYear}`);

        setEvents([
          ...eventsData.events,
          ...holidaysData.holidays.map((holiday: any) => ({
            id: holiday.id,
            title: holiday.title,
            start: holiday.date,
            allDay: true,
            className: 'bank-holiday'
          }))
        ]);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          console.error('Authentication error - please login');
        } else {
          console.error('Failed to fetch events:', error);
        }
      }
    };

    fetchEvents();
  }, [user]);

  const handleViewChange = (newView: typeof view) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(newView);
      setView(newView);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      direction === 'prev' ? calendarApi.prev() : calendarApi.next();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleEventClick = (info: EventClickArg) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start || new Date(),
      end: event.end || new Date(),
      status: event.extendedProps.status || 'available',
      private: event.extendedProps.private || false,
      color: event.backgroundColor,
      className: event.classNames[0]
    });
    setSelectedDates({
      start: event.start || new Date(),
      end: event.end || new Date()
    });
    setIsModalOpen(true);
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedEvent(undefined);
    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setIsModalOpen(true);
  };

  const handleEventSave = async (eventData: Partial<Event>) => {
    setIsSaving(true);
    const fullCalendarApi = calendarRef.current?.getApi();
    
    try {
      const year = format(selectedDates.start, 'yyyy');
      const site = user?.sites[0] || 'main';

      let savedEvent;
      if (selectedEvent?.id) {
        // Update existing event
        savedEvent = await serverApi.updateEvent(site, year, selectedEvent.id, eventData);
      } else {
        // Create new event
        savedEvent = await serverApi.createEvent(site, year, eventData);
      }

      if (fullCalendarApi) {
        if (selectedEvent) {
          const existingEvent = fullCalendarApi.getEventById(selectedEvent.id);
          if (existingEvent) {
            existingEvent.remove();
          }
        }
        
        fullCalendarApi.addEvent({
          id: savedEvent.id,
          ...eventData,
          start: savedEvent.start,
          end: savedEvent.end
        });
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      // You could add a toast notification here
    } finally {
      setIsSaving(false);
      setSelectedEvent(undefined);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    setIsSaving(true);
    try {
      const year = format(selectedDates.start, 'yyyy');
      const site = user?.sites[0] || 'main';
      
      await serverApi.deleteEvent(site, year, eventId);
      
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        const existingEvent = calendarApi.getEventById(eventId);
        if (existingEvent) {
          existingEvent.remove();
        }
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setIsSaving(false);
      setSelectedEvent(undefined);
      setIsModalOpen(false);
    }
  };

  // Update customDayHeader to handle day view
  const customDayHeader = (args: any) => {
    const date = args.date;
    const currentView = calendarRef.current?.getApi().view.type;
    
    if (currentView === 'dayGridMonth') {
      return args.text; // Use default for month view
    }

    // For day and week views, show enhanced format with holidays
    const holiday = events.find(event => 
      event.className === 'bank-holiday' && 
      new Date(event.start).toDateString() === date.toDateString()
    );

    const dayText = format(date, 'EEE d');

    return (
      <div className="day-header">
        <div className="day-title">
          {dayText}
        </div>
        {holiday && (
          <div className="bank-holiday-label">
            {holiday.title}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              Team Calendar
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewChange('timeGridDay')}
              className={`px-4 py-2 rounded-lg ${
                view === 'timeGridDay'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-4 py-2 rounded-lg ${
                view === 'timeGridWeek'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange('dayGridMonth')}
              className={`px-4 py-2 rounded-lg ${
                view === 'dayGridMonth'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange('multiMonthYear')}
              className={`px-4 py-2 rounded-lg ${
                view === 'multiMonthYear'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
          initialView={view}
          headerToolbar={false}
          editable={!isTeamMember}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          nowIndicator={true}
          views={{
            timeGridDay: { buttonText: 'Day' },
            timeGridWeek: { buttonText: 'Week' },
            dayGridMonth: { buttonText: 'Month' },
            multiMonthYear: { buttonText: 'Year' }
          }}
          events={events}
          dayHeaderContent={customDayHeader}
        />
      </div>
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(undefined);
        }}
        onSave={handleEventSave}
        startDate={selectedDates.start}
        endDate={selectedDates.end}
        isTeamMember={isTeamMember}
        event={selectedEvent}
      />
      <SaveNotification show={isSaving} />
    </div>
  );
};