import { useState } from "react";
import { getWeekNumber } from "../../utils/dateUtils";
import { startOfWeek, endOfWeek, format } from "date-fns";

interface WeekNumberProps {
  date: Date;
  onWeekClick?: (startDate: Date, endDate: Date) => void;
}

export function WeekNumber({ date, onWeekClick }: WeekNumberProps) {
  const [isHovered, setIsHovered] = useState(false);
  const weekNumber = getWeekNumber(date);

  const handleClick = () => {
    if (onWeekClick) {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start from Monday
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // End on Sunday
      onWeekClick(weekStart, weekEnd);
    }
  };

  return (
    <div
      className={`flex items-center justify-center text-xs font-medium transition-colors duration-200 cursor-pointer
        ${isHovered 
          ? "bg-blue-50 text-blue-600" 
          : "bg-white text-zinc-500"}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Click to create holiday for week ${weekNumber} (${format(startOfWeek(date, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(date, { weekStartsOn: 1 }), "MMM d")})`}
      data-tsx-id="week-number"
    >
      {weekNumber}
    </div>
  );
}