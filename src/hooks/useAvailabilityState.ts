import { useState } from "react";
import { WeeklySchedule, TimeSlot } from "../types/availability";
import { User } from "../types/user";
import { updateUserAvailabilitySchedule } from "../lib/api";
import toast from "react-hot-toast";

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
  const availability = Array.isArray(colleague.settings?.availability)
    ? colleague.settings.availability
    : colleague.settings?.availability
      ? [colleague.settings.availability]
      : [];

  const initialEntry = availability[0] || {
    weeklySchedule: createDefaultSchedule(),
    oddWeeklySchedule: createDefaultSchedule(),
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    repeatPattern: "all" as const,
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(initialEntry.startDate);
  const [endDate, setEndDate] = useState(initialEntry.endDate || "");
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(
    initialEntry.repeatPattern || "all"
  );
  const [schedule, setSchedule] = useState<WeeklySchedule>(
    initialEntry.weeklySchedule || createDefaultSchedule()
  );
  const [alternateSchedule, setAlternateSchedule] = useState<WeeklySchedule>(
    initialEntry.oddWeeklySchedule || createDefaultSchedule()
  );

  const handleTimeSlotToggle = async (
    token: string | null,
    userId: string,
    currentEntryIndex: number,
    day: keyof WeeklySchedule,
    slot: keyof TimeSlot,
    isAlternate: boolean
  ) => {
    if (!token || currentEntryIndex === -1) return;

    try {
      setLoading(true);
      setError("");

      // Create new schedule with toggled value
      const targetSchedule = isAlternate ? alternateSchedule : schedule;
      const newValue = !targetSchedule[day][slot];

      const updatedSchedule = {
        ...targetSchedule,
        [day]: {
          ...targetSchedule[day],
          [slot]: newValue
        }
      };

      // Update state immediately for UI responsiveness
      if (isAlternate) {
        setAlternateSchedule(updatedSchedule);
      } else {
        setSchedule(updatedSchedule);
      }

      // Prepare data for API
      const availabilityData = {
        weeklySchedule: isAlternate ? schedule : updatedSchedule,
        oddWeeklySchedule: isAlternate ? updatedSchedule : alternateSchedule,
        startDate,
        endDate,
        repeatPattern,
      };

      // Update server
      await updateUserAvailabilitySchedule(
        token,
        userId,
        currentEntryIndex,
        availabilityData
      );

    } catch (err) {
      // Revert on error
      if (isAlternate) {
        setAlternateSchedule(alternateSchedule);
      } else {
        setSchedule(schedule);
      }
      setError(err instanceof Error ? err.message : "Failed to update schedule");
      toast.error("Failed to update availability");
    } finally {
      setLoading(false);
    }
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