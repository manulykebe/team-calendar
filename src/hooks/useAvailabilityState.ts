import { useState } from "react";
import { WeeklySchedule, TimeSlot } from "../types/availability";
import { User } from "../types/user";
import { updateUserAvailabilitySchedule } from "../lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export type RepeatPattern = "all" | "evenodd";

const createDefaultSchedule = () => {
  return DAYS.reduce(
    (acc, day) => ({
      ...acc,
      [day]: { am: true, pm: true },
    }),
    {} as WeeklySchedule,
  );
};

export function useAvailabilityState(colleague: User) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>("all");
  const [schedule, setSchedule] = useState<WeeklySchedule>(createDefaultSchedule());
  const [alternateSchedule, setAlternateSchedule] = useState<WeeklySchedule>(createDefaultSchedule());

  const handleTimeSlotToggle = async (
    token: string | null,
    userId: string,
    currentEntryIndex: number,
    day: keyof WeeklySchedule,
    slot: keyof TimeSlot,
    isAlternate: boolean,
  ) => {
    if (!token || currentEntryIndex === -1) return;

    try {
      setLoading(true);

      // Create new schedule object with toggled value
      const targetSchedule = isAlternate ? alternateSchedule : schedule;
      const updatedSchedule = {
        ...targetSchedule,
        [day]: {
          ...targetSchedule[day],
          [slot]: !targetSchedule[day]?.[slot],
        },
      };

      // Prepare availability data
      const availability = {
        weeklySchedule: isAlternate ? schedule : updatedSchedule,
        alternateWeekSchedule: isAlternate ? updatedSchedule : alternateSchedule,
        startDate,
        endDate,
        repeatPattern,
      };

      // Save to server first
      await updateUserAvailabilitySchedule(
        token,
        userId,
        currentEntryIndex,
        availability
      );

      // Only update state after successful server update
      if (isAlternate) {
        setAlternateSchedule(updatedSchedule);
      } else {
        setSchedule(updatedSchedule);
      }

      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update schedule");
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