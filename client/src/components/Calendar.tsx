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

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: 'unavailable' | 'desired' | 'available';
  private: boolean;
  color?: string;
  className?: string;
}

type CalendarView = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'multiMonthYear';

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

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setStatus(event.status);
      setIsPrivate(event.private);
    }
  }, [event]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      status,
      private: isPrivate,
      start: startDate,
      end: endDate,
      color: status === 'unavailable' ? '#EF4444' : status === 'desired' ? undefined : '#10B981',
      className: status === 'desired' ? 'desired-event' : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Event</h2>
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
              //disabled={isTeamMember}
            >
              <option value="available">Available</option>
              <option value="desired">Desired</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
};

export const Calendar: React.FC = () => {
  const { user } = useAuth();
  const isTeamMember = user?.roles.includes('team-member') ?? false;
  const [view, setView] = useState<CalendarView>(isTeamMember ? 'dayGridMonth' : 'timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date }>({ start: new Date(), end: new Date() });
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'desired' | 'available' | 'confirmed'>('desired');
  const calendarRef = useRef<FullCalendar>(null);

  const handleViewChange = (newView: CalendarView) => {
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
    setTitle(event.title);
    setStatus(event.extendedProps.status || 'available');
    setSelectedDates({
      start: event.start || new Date(),
      end: event.end || new Date()
    });
    setIsModalOpen(true);
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setIsModalOpen(true);
  };

  const handleEventSave = (eventData: Partial<Event>) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.addEvent({
        id: String(Date.now()),
        ...eventData,
      });
    }
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
          initialEvents={[
            {
              id: '1',
              title: 'Team Meeting',
              start: new Date().setHours(10, 0),
              end: new Date().setHours(11, 30),
            },
          ]}
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
        />
      </div>
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleEventSave}
        startDate={selectedDates.start}
        endDate={selectedDates.end}
        isTeamMember={isTeamMember}
      />
    </div>
  );
};