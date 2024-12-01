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
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';

interface Event {
  id: string;
  userId: string;
  title: string;
  start: Date | string;
  end: Date | string;
  status: string;
  private: boolean;
  color?: string;
  className?: string;
  allDay?: boolean;
  extendedProps?: {
    colleagueId?: string;
    [key: string]: any;
  }
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

const getUserColorClass = (userId: string) => {
  // Map user ID to a color number 1-5
  if (!userId || userId === '') return '';
  const colorIndex = (parseInt(userId, 16) % 5) + 1;
  return `user-color-${colorIndex}`;
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

  const [isColleaguesPanelOpen, setIsColleaguesPanelOpen] = useState(false);
  const [colleagues, setColleagues] = useState<{ id: string; login: string }[]>([]);
  const [selectedColleagues, setSelectedColleagues] = useState<string[]>([]);
  const [allColleaguesSelected, setAllColleaguesSelected] = useState(false);

  const toggleColleaguesPanel = () => {
    setIsColleaguesPanelOpen(!isColleaguesPanelOpen);
  };

  useEffect(() => {
    if (isColleaguesPanelOpen && colleagues.length === 0) {
      api.get('/api/colleagues')
        .then(response => {
          setColleagues(response.data.colleagues);
        })
        .catch(error => {
          console.error('Failed to fetch colleagues:', error);
        });
    }
  }, [isColleaguesPanelOpen]);

  const handleColleagueToggle = (colleagueId: string, isSelected: boolean) => {
    let updatedSelectedColleagues;
    if (isSelected) {
      updatedSelectedColleagues = [...selectedColleagues, colleagueId];
      fetchColleagueEvents(colleagueId);
    } else {
      updatedSelectedColleagues = selectedColleagues.filter(id => id !== colleagueId);
      removeColleagueEvents(colleagueId);
    }
    setSelectedColleagues(updatedSelectedColleagues);
    setAllColleaguesSelected(updatedSelectedColleagues.length === colleagues.length);
  };

  const handleToggleAllColleagues = () => {
    if (allColleaguesSelected) {
      setSelectedColleagues([]);
      setAllColleaguesSelected(false);
      colleagues.forEach(colleague => removeColleagueEvents(colleague.id));
    } else {
      const allIds = colleagues.map(colleague => colleague.id);
      setSelectedColleagues(allIds);
      setAllColleaguesSelected(true);
      colleagues.forEach(colleague => fetchColleagueEvents(colleague.id));
    }
  };

  const fetchColleagueEvents = (colleagueId: string) => {
    const site = user?.sites[0] || 'main';
    const year = format(currentDate, 'yyyy');
    api.get(`/api/sites/${site}/events/${year}?userId=${colleagueId}`)
      .then(response => {
        const colleagueEvents = response.data.events.map((event: Event) => ({
          ...event,
          id: `${colleagueId}-${event.id}`, // Make the ID unique
          extendedProps: {
            ...event.extendedProps,
            colleagueId,
          },
        }));
        setEvents(prevEvents => [...prevEvents, ...colleagueEvents]);
      })
      .catch(error => {
        console.error('Failed to fetch colleague events:', error);
      });
  };

  const removeColleagueEvents = (colleagueId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.extendedProps?.colleagueId !== colleagueId));
  };

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

  const isOwnedEvent = (event: Event): boolean => {
    return event.userId === user?.id;
  };

  const handleEventClick = (info: EventClickArg) => {
    const event = info.event;
    if (!isOwnedEvent({ 
      id: event.id,
      userId: event.extendedProps.userId,
      title: event.title,
      start: event.start || new Date(),
      end: event.end || new Date(),
      status: event.extendedProps.status,
      private: event.extendedProps.private,
      color: event.backgroundColor,
      className: event.classNames[0],
      allDay: event.allDay,
      extendedProps: event.extendedProps
    })) {
      return; // Early return for events not owned by user
    }

    setSelectedEvent({
      id: event.id,
      userId: event.extendedProps.userId || '',
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
    // New events are always allowed since they'll be owned by current user
    setSelectedEvent(undefined);
    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setIsModalOpen(true);
  };

  const handleEventSave = async (eventData: Partial<Event>) => {
    if (selectedEvent && !canModifyEvent(selectedEvent)) {
      toast.error('You can only modify your own events');
      return;
    }

    setIsSaving(true);

    try {
      const year = format(selectedDates.start, 'yyyy');
      const site = user?.sites[0] || 'main';

      const encryptKey = Cookies.get('encryptKey');

      // Encrypt the event title if it's private and an encryption key is available
      if (eventData.private && encryptKey) {
        const encryptedTitle = CryptoJS.AES.encrypt(eventData.title || '', encryptKey).toString();
        eventData.title = encryptedTitle;
      }

      let savedEvent;

      if (selectedEvent) {
        savedEvent = await serverApi.updateEvent(site, year, selectedEvent.id, eventData);
        // Update event in calendar
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          const existingEvent = calendarApi.getEventById(selectedEvent.id);
          if (existingEvent) {
            existingEvent.setProp('title', eventData.title);
            existingEvent.setExtendedProp('private', eventData.private);
            existingEvent.setExtendedProp('userId', user?.id);
            if (eventData.start) {
              existingEvent.setStart(eventData.start);
            }
            if (eventData.end) {
              existingEvent.setEnd(eventData.end);
            }
          }
        }
      } else {
        savedEvent = await serverApi.createEvent(site, year, eventData);
        // Add event to calendar
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.addEvent({
            ...savedEvent,
            title: eventData.title,
          });
        }
      }

      toast.success('Event saved successfully');
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error('Failed to save event');
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setSelectedEvent(undefined);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event || !canModifyEvent(event)) {
      toast.error('You can only delete your own events');
      return;
    }

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
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsSaving(false);
      setSelectedEvent(undefined);
      setIsModalOpen(false);
    }
  };

  const canModifyEvent = (event: Event): boolean => {
    const isAdmin = user?.roles.includes('admin');
    const isOwner = event.userId === user?.id;
    return isAdmin || isOwner;
  };

  // Update customDayHeader to handle day view
  const customDayHeader = (args: any) => {
    const date = args.date;
    const currentView = calendarRef.current?.getApi().view.type;
    
    if (currentView === 'dayGridMonth' ||currentView === 'multiMonthYear') {
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

  const handleEventUpdate = async (updatedEvent: Partial<Event>) => {
    try {
      const year = format(updatedEvent.start || new Date(), 'yyyy');
      const site = user?.sites[0] || 'main';
      await serverApi.updateEvent(site, year, updatedEvent.id!, updatedEvent);
      toast.success('Event updated successfully');
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error('Failed to update event');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button onClick={toggleColleaguesPanel} className="relative">
              <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
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
        {isColleaguesPanelOpen && (
          <div className="absolute top-16 left-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Colleagues</h2>
              <button onClick={handleToggleAllColleagues} className="text-sm text-blue-600 hover:underline">
                {allColleaguesSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {colleagues.map(colleague => (
                <div key={colleague.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedColleagues.includes(colleague.id)}
                    onChange={(e) => handleColleagueToggle(colleague.id, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-800 dark:text-white">{colleague.login}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
          initialView={view}
          headerToolbar={false}
          editable={true}
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
          eventAllow={(dropInfo, draggedEvent) => {
            // Only allow dragging owned events
            return isOwnedEvent({
              id: draggedEvent?.id || '',
              userId: draggedEvent?.extendedProps.userId || '',
              title: draggedEvent?.title || '',
              start: draggedEvent?.start || new Date(),
              end: draggedEvent?.end || new Date(),
              status: draggedEvent?.extendedProps.status || 'available',
              private: draggedEvent?.extendedProps.private || false,
              color: draggedEvent?.backgroundColor || '',
              className: draggedEvent?.classNames[0] || '',
              allDay: draggedEvent?.allDay || false,
              extendedProps: draggedEvent?.extendedProps || {}
            });
          }}
          eventDrop={(info) => {
            // Handle the event drop
            const updatedEvent = {
              id: info.event.id,
              start: info.event.start || undefined,
              end: info.event.end || undefined
            };
            
            // Call your update function here
            handleEventUpdate(updatedEvent);
          }}
          eventDidMount={(info) => {
            // Existing mount handler code...
            // Add visual cue for non-selectable events
            if (!isOwnedEvent({ 
              id: info.event.id,
              userId: info.event.extendedProps.userId,
              title: info.event.title,
              start: info.event.start || new Date(),
              end: info.event.end || new Date(),
              status: info.event.extendedProps.status,
              private: info.event.extendedProps.private,
              color: info.event.backgroundColor,
              className: info.event.classNames[0],
              allDay: info.event.allDay,
              extendedProps: info.event.extendedProps
            })) {
              info.el.style.cursor = 'default';
              info.el.style.opacity = '0.5';
            } else {
              info.el.style.cursor = 'pointer';
            }
          }}
          views={{
            timeGridDay: { buttonText: 'Day' },
            timeGridWeek: { buttonText: 'Week' },
            dayGridMonth: { buttonText: 'Month' },
            multiMonthYear: { buttonText: 'Year' }
          }}
          events={events}
          dayHeaderContent={customDayHeader}
          eventClassNames={(eventInfo) => {
            return [getUserColorClass(eventInfo.event.extendedProps.userId)];
          }}
          // eventContent={(eventInfo) => {          
          //   return (
          //     <div className="fc-event-main-frame">
          //       <div className="fc-event-time">
          //         {eventInfo.timeText || '12:00 - 11:59'}
          //       </div>
          //       <div className="fc-event-title-container">
          //         <div className="fc-event-title fc-sticky">
          //           {eventInfo.event.title}
          //         </div>
          //       </div>
          //     </div>
          //   );
          // }}
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