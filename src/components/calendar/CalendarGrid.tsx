import { DayCell } from './DayCell';
import { getCalendarDays } from '../../utils/calendar';
import { Event } from '../../types/event';
import { User } from '../../types/user';

interface CalendarGridProps {
  currentMonth: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  weekStartsOn: string;
  userSettings?: any;
  onEventDelete?: (eventId: string) => void;
  currentUser?: User | null;
}

export function CalendarGrid({ 
  currentMonth, 
  events, 
  onDateClick,
  weekStartsOn,
  userSettings,
  onEventDelete,
  currentUser
}: CalendarGridProps) {
  const { days, emptyDays, weekDays } = getCalendarDays(currentMonth, weekStartsOn as any);

  return (
    <>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {Array.from({ length: emptyDays }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[120px] bg-white p-2" />
        ))}
        
        {days.map((day) => (
          <DayCell
            key={day.toString()}
            date={day}
            events={events}
            onDateClick={onDateClick}
            userSettings={userSettings}
            onEventDelete={onEventDelete}
            currentUser={currentUser}
          />
        ))}
      </div>
    </>
  );
}