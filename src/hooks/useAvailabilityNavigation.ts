import { useState, useEffect, useCallback } from "react";
import { User } from "../types/user";
import { WeeklySchedule } from "../types/availability";
import { parseISO, format, isValid } from "date-fns";

interface UseAvailabilityNavigationProps {
  colleague: User;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setRepeatPattern: (pattern: "all" | "evenodd") => void;
  setSchedule: (schedule: WeeklySchedule) => void;
  setAlternateSchedule: (schedule: WeeklySchedule) => void;
}

const createDefaultSchedule = (): WeeklySchedule => ({
  Monday: { am: true, pm: true },
  Tuesday: { am: true, pm: true },
  Wednesday: { am: true, pm: true },
  Thursday: { am: true, pm: true },
  Friday: { am: true, pm: true },
});

const formatDateString = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, "yyyy-MM-dd") : "";
  } catch {
    return "";
  }
};

export function useAvailabilityNavigation({
  colleague,
  setStartDate,
  setEndDate,
  setRepeatPattern,
  setSchedule,
  setAlternateSchedule,
}: UseAvailabilityNavigationProps) {
  const [currentEntryIndex, setCurrentEntryIndex] = useState(-1);

  // Load entry with fresh data
  const loadEntry = useCallback(
    (index: number) => {
      const availability = Array.isArray(colleague.settings?.availability)
        ? colleague.settings.availability
        : colleague.settings?.availability
          ? [colleague.settings.availability]
          : [];

      const entry = availability[index];
      if (!entry) return;

      setStartDate(formatDateString(entry.startDate));
      setEndDate(formatDateString(entry.endDate));
      setRepeatPattern(entry.repeatPattern || "all");

      if (entry.weeklySchedule) {
        setSchedule(JSON.parse(JSON.stringify(entry.weeklySchedule)));
      } else {
        setSchedule(createDefaultSchedule());
      }

      if (entry.repeatPattern === "evenodd" && entry.alternateWeekSchedule) {
        setAlternateSchedule(
          JSON.parse(JSON.stringify(entry.alternateWeekSchedule)),
        );
      } else {
        setAlternateSchedule(createDefaultSchedule());
      }
    },
    [
      colleague,
      setStartDate,
      setEndDate,
      setRepeatPattern,
      setSchedule,
      setAlternateSchedule,
    ],
  );

  // Initialize with first entry
  useEffect(() => {
    const availability = Array.isArray(colleague.settings?.availability)
      ? colleague.settings.availability
      : colleague.settings?.availability
        ? [colleague.settings.availability]
        : [];

    if (availability.length > 0) {
      setCurrentEntryIndex(0);
      loadEntry(0);
    } else {
      setCurrentEntryIndex(-1);
    }
  }, [colleague, loadEntry]);

  const handlePrevEntry = useCallback(() => {
    const availability = Array.isArray(colleague.settings?.availability)
      ? colleague.settings.availability
      : colleague.settings?.availability
        ? [colleague.settings.availability]
        : [];

    if (availability.length === 0 || currentEntryIndex <= 0) return;
    const newIndex = currentEntryIndex - 1;
    setCurrentEntryIndex(newIndex);
    loadEntry(newIndex);
  }, [colleague, currentEntryIndex, loadEntry]);

  const handleNextEntry = useCallback(() => {
    const availability = Array.isArray(colleague.settings?.availability)
      ? colleague.settings.availability
      : colleague.settings?.availability
        ? [colleague.settings.availability]
        : [];

    if (
      availability.length === 0 ||
      currentEntryIndex >= availability.length - 1
    )
      return;
    const newIndex = currentEntryIndex + 1;
    setCurrentEntryIndex(newIndex);
    loadEntry(newIndex);
  }, [colleague, currentEntryIndex, loadEntry]);

  return {
    currentEntryIndex,
    totalEntries: Array.isArray(colleague.settings?.availability)
      ? colleague.settings.availability.length
      : colleague.settings?.availability
        ? 1
        : 0,
    handlePrevEntry,
    handleNextEntry,
  };
}
