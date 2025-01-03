import React from 'react';
import { CalendarEvent } from '../../types/calendar';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({ currentDate, events, onEventClick }: MonthViewProps) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startingDay }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  return (
    <div className="grid grid-cols-7 gap-1 p-4">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 text-center font-semibold text-gray-600">
          {day}
        </div>
      ))}
      
      {blanks.map(blank => (
        <div key={`blank-${blank}`} className="p-2 bg-gray-50 min-h-[100px]" />
      ))}
      
      {days.map(day => {
        const dayEvents = getEventsForDay(day);
        return (
          <div
            key={day}
            className="p-2 bg-white border min-h-[100px] hover:bg-gray-50"
          >
            <div className="font-medium mb-1">{day}</div>
            <div className="space-y-1">
              {dayEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full text-left text-sm p-1 bg-blue-100 text-blue-800 rounded truncate hover:bg-blue-200"
                >
                  {event.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}