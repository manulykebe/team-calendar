import { useMemo } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export function useCalendarDates(currentMonth: Date, showWeekends: boolean) {
  return useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    if (!showWeekends) {
      return days.filter((day) => ![0, 6].includes(day.getDay()));
    }

    return days;
  }, [currentMonth, showWeekends]);
}
