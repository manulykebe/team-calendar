import { useState, useEffect } from "react";
import { DayCell } from "./DayCell";
import { CalendarHeader } from "./CalendarHeader";
import { WeekColumn } from "./WeekColumn";
import { getCalendarDays } from "../../utils/calendar";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { Holiday, getHolidays } from "../../lib/api/holidays";
import { format } from "date-fns";
import { getSiteData } from "../../lib/api/client";

interface CalendarGridProps {
  currentMonth: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  weekStartsOn: string;
  userSettings?: any;
  onEventDelete?: (eventId: string) => void;
  currentUser?: User | null;
  onEventResize?: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
}

export function CalendarGrid({
  currentMonth,
  events,
  onDateClick,
  weekStartsOn,
  userSettings,
  onEventDelete,
  currentUser,
  onEventResize,
}: CalendarGridProps) {
  const [error, setError] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const { days, emptyDays, weekDays } = getCalendarDays(
    currentMonth,
    weekStartsOn as any
  );

  useEffect(() => {
    const fetchHolidays = async () => {
      if (!currentUser?.site) return;

      const year = format(currentMonth, 'yyyy');
      try {
        // Fetch site data to get location
        const siteData = await getSiteData(currentUser.site);
        const location = siteData.app.location || 'BE';
        
        const holidayData = await getHolidays(year, location);
        setHolidays(holidayData);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
        setError('Failed to fetch holidays');
      }
    };
    fetchHolidays();
  }, [currentMonth, currentUser]);

  const showWeekNumber = currentUser?.settings?.showWeekNumber || "none";

  // Calculate the number of visible colleagues
  const visibleColleagues = currentUser?.settings?.colleagues
    ? Object.values(currentUser.settings.colleagues).filter((c: any) => c.visible !== false).length
    : 1;

  // Calculate row height: base height (120px) + additional height per colleague (24px)
  const rowHeight = Math.max(120, 42 + visibleColleagues * 24);

  return (
    <div className="bg-zinc-200">
      <CalendarHeader weekDays={weekDays} showWeekNumber={showWeekNumber} />
      <div className={`grid ${
        showWeekNumber === "left" 
          ? "grid-cols-[3rem_1fr]" 
          : showWeekNumber === "right" 
            ? "grid-cols-[1fr_3rem]" 
            : "grid-cols-1"
      } gap-px bg-zinc-200`}>
        {showWeekNumber === "left" && <WeekColumn days={days} position="left" rowHeight={rowHeight} />}
        <div 
          className="grid grid-cols-7 gap-px bg-zinc-200"
          style={{ 
            gridAutoRows: `${rowHeight}px`
          }}
        >
          {Array.from({ length: emptyDays }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-white p-2" />
          ))}
          {days.map((day) => {
            const formattedDate = format(day, 'yyyy-MM-dd');
            const holiday = holidays.find(h => h.date === formattedDate);
            
            return (
              <DayCell
                key={day.toISOString()}
                date={day}
                events={events}
                onDateClick={onDateClick}
                userSettings={userSettings}
                onEventDelete={onEventDelete}
                currentUser={currentUser}
                onEventResize={onEventResize}
                holiday={holiday}
              />
            );
          })}
        </div>
        {showWeekNumber === "right" && <WeekColumn days={days} position="right" rowHeight={rowHeight} />}
      </div>
    </div>
  );
}