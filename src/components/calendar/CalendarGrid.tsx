import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface CalendarGridProps {
  currentDate: Date;
  events: Array<{
    id: string;
    title: string;
    date: string;
  }>;
  onDateClick: (date: Date) => void;
}

export function CalendarGrid({ currentDate, events, onDateClick }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
          {day}
        </div>
      ))}
      
      {days.map((day) => {
        const dayEvents = events.filter(
          (event) => event.date === format(day, 'yyyy-MM-dd')
        );
        
        return (
          <button
            key={day.toISOString()}
            onClick={() => onDateClick(day)}
            className="p-2 border border-gray-200 hover:bg-gray-50 min-h-[80px] flex flex-col"
          >
            <span className="text-sm font-medium">{format(day, 'd')}</span>
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="mt-1 text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
              >
                {event.title}
              </div>
            ))}
          </button>
        );
      })}
    </div>
  );
}