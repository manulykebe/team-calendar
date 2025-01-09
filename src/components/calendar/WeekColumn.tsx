import { getWeekNumber } from '../../utils/dateUtils';
import { WeekNumber } from './WeekNumber';

interface WeekColumnProps {
  days: Date[];
  position: "left" | "right";
}

export function WeekColumn({ days, position }: WeekColumnProps) {
  // Get unique weeks, but only for the actual calendar days we're showing
  const uniqueWeeks = days
    .reduce((acc, day) => {
      const weekNum = getWeekNumber(day);
      if (!acc.some(w => w.weekNum === weekNum)) {
        acc.push({ weekNum, day });
      }
      return acc;
    }, [] as { weekNum: number; day: Date }[])
    .slice(0, 5); // Ensure we only show 5 weeks

  return (
    <div className="grid auto-rows-[120px] bg-white">
      {uniqueWeeks.map(({ weekNum, day }) => (
        <WeekNumber key={weekNum} date={day} />
      ))}
    </div>
  );
}