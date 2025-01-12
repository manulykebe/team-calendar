import { getWeekNumber } from "../../utils/dateUtils";

interface WeekNumberProps {
  date: Date;
}

export function WeekNumber({ date }: WeekNumberProps) {
  const weekNumber = getWeekNumber(date);
  
  return (
    <div className="flex items-center justify-center bg-white text-xs font-medium text-zinc-500" data-tsx-id="week-number">
      {weekNumber}
    </div>
  );
}