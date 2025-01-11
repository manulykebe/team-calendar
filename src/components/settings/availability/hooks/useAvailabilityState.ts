import { useState } from "react";
import { format } from "date-fns";
import { WeeklySchedule, TimeSlot } from "../../../../types/availability";
import { User } from "../../../../types/user";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export type RepeatPattern = "all" | "evenodd";

const createDefaultSchedule = () => {
  return DAYS.reduce(
    (acc, day) => ({
      ...acc,
      [day]: { am: true, pm: true },
    }),
    {} as WeeklySchedule
  );
};

export function useAvailabilityState(colleague: User) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Ensure availability is always an array
  const availability = Array.isArray(colleague.settings?.availability) 
    ? colleague.settings.availability 
    : colleague.settings?.availability 
      ? [colleague.settings.availability]
      : [];

  // Initialize state with the first availability entry if it exists
  const initialEntry = availability[0] || {
    weeklySchedule: createDefaultSchedule(),
    alternateWeekSchedule: createDefaultSchedule(),
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    repeatPattern: "all" as const
  };

  const [startDate, setStartDate] = useState(initialEntry.startDate);
  const [endDate, setEndDate] = useState(initialEntry.endDate || "");
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(
    initialEntry.repeatPattern || "all"
  );

  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    return initialEntry.weeklySchedule || createDefaultSchedule();
  });

  const [alternateSchedule, setAlternateSchedule] = useState<WeeklySchedule>(() => {
    return initialEntry.alternateWeekSchedule || createDefaultSchedule();
  });

  const handleTimeSlotToggle = (
    day: keyof WeeklySchedule,
    slot: keyof TimeSlot,
    isAlternate = false
  ) => {
    const setterFunction = isAlternate ? setAlternateSchedule : setSchedule;
    setterFunction((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: !prev[day][slot],
      },
    }));
  };

  return {
    loading,
    setLoading,
    error,
    setError,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    repeatPattern,
    setRepeatPattern,
    schedule,
    setSchedule,
    alternateSchedule,
    setAlternateSchedule,
    handleTimeSlotToggle,
  };
}