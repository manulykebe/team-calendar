import { WeekDayHeader } from './WeekDayHeader';

interface CalendarHeaderProps {
  weekDays: string[];
  showWeekNumber: "left" | "right" | "none";
}

export function CalendarHeader({ weekDays, showWeekNumber }: CalendarHeaderProps) {
  return (
    <div className={`grid  ${
      showWeekNumber === "left" 
        ? "grid-cols-[3rem_1fr]" 
        : showWeekNumber === "right" 
          ? "grid-cols-[1fr_3rem]" 
          : "grid-cols-1"
    } gap-px bg-zinc-200`} data-tsx-id="calendar-header">
      {showWeekNumber === "left" && <div className="bg-zinc-50 py-2 border-b border-zinc-200" />}
      <WeekDayHeader weekDays={weekDays} />
      {showWeekNumber === "right" && <div className="bg-zinc-50 py-2 border-b border-zinc-200" />}
    </div>
  );
}