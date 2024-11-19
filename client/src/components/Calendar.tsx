import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
}

type CalendarView = 'timeGridDay' | 'timeGridWeek' | 'multiMonthYear';

export const Calendar: React.FC = () => {
  const [view, setView] = useState<CalendarView>('timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const handleEventClick = (info: any) => {
    alert(`Event: ${info.event.title}`);
  };

  const handleDateSelect = (selectInfo: any) => {
    const title = prompt('Please enter a title for your event');
    if (title) {
      const calendarApi = selectInfo.view.calendar;
      calendarApi.addEvent({
        id: String(Date.now()),
        title,
        start: selectInfo.start,
        end: selectInfo.end,
        allDay: selectInfo.allDay,
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
          editable={true}
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
            multiMonthYear: { buttonText: 'Year' }
          }}
        />
      </div>
    </div>
  );
};