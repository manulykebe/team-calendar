import { useState } from "react";
import { getWeekNumber } from "../../utils/dateUtils";
import { startOfWeek, endOfWeek, format, parseISO, getMonth } from "date-fns";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { useAuth } from "../../context/AuthContext";
import { deleteEvent } from "../../lib/api";
import toast from "react-hot-toast";

interface WeekNumberProps {
  date: Date;
  onWeekClick?: (startDate: Date, endDate: Date) => void;
  events?: Event[];
  currentUser?: User | null;
  onEventDelete?: (eventId: string) => void;
}

export function WeekNumber({ 
  date, 
  onWeekClick, 
  events = [], 
  currentUser,
  onEventDelete 
}: WeekNumberProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { token } = useAuth();
  const weekNumber = getWeekNumber(date);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start from Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // End on Sunday

  const monthWeekStart = format(weekStart, "MMMM");
  const monthWeekEnd = format(weekEnd, "MMMM");
  // Check if there's an existing holiday request for this week
  const existingHoliday = events.find(event => {
    if (event.userId !== currentUser?.id) return false;
    if (!["requestedHoliday", "requestedHolidayMandatory"].includes(event.type)) return false;
    
    const eventStart = parseISO(event.date);
    const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;
    
    return (
      format(eventStart, "yyyy-MM-dd") === format(weekStart, "yyyy-MM-dd") &&
      format(eventEnd, "yyyy-MM-dd") === format(weekEnd, "yyyy-MM-dd")
    );
  });

  const handleClick = async () => {
    if (!token || !currentUser) {
      toast.error("You must be logged in to request holidays");
      return;
    }

    if (existingHoliday && onEventDelete) {
      // Delete existing holiday request
      try {
        await deleteEvent(token, existingHoliday.id);
        onEventDelete(existingHoliday.id);
        toast.success("Holiday request deleted");
      } catch (error) {
        toast.error("Failed to delete holiday request");
      }
    } else if (onWeekClick) {
      // Create new holiday request
      onWeekClick(weekStart, weekEnd);
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center text-xs font-medium transition-colors duration-200 cursor-pointer
        ${isHovered 
          ? "bg-blue-50 text-blue-600" 
          : existingHoliday 
            ? "bg-red-50 text-red-600"
            : "bg-white text-zinc-500"}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={existingHoliday 
        ? `Click to delete holiday for week ${weekNumber} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`
        : `Click to create holiday for week ${weekNumber} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`}
      data-tsx-id="week-number"
    >
      {weekNumber}
      <div className="text-xs absolute inset-x-0 -top-0.5 -left-0.5 font-medium text-zinc-400 pointer-events-none">
      {monthWeekStart}
        {/* {monthWeekStart === monthWeekEnd ? monthWeekStart : `${monthWeekStart} ${monthWeekEnd}`} */}
        </div>
    </div>
  );
}