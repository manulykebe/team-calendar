import { getWeekNumber } from '../../utils/dateUtils';
import { WeekNumber } from './WeekNumber';

interface WeekColumnProps {
  days: Date[];
  position: "left" | "right";
}

export function WeekColumn({ days, position }: WeekColumnProps) {
  const weeks = new Map<number, Date>();
  
  // Get first day of each week
  days.forEach(day => {
    const weekNum = getWeekNumber(day);
    if (!weeks.has(weekNum)) {
      weeks.set(weekNum, day);
    }
  });

  return (
    <div className="grid auto-rows-[120px] bg-white">
      {Array.from(weeks.values()).map((day) => (
        <WeekNumber key={day.toISOString()} date={day} />
      ))}
    </div>
  );
}