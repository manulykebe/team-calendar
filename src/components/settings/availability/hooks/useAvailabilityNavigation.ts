import { useState, useEffect } from "react";
import { User } from "../../../../types/user";
import { WeeklySchedule } from "../../../../types/availability";

interface UseAvailabilityNavigationProps {
  colleague: User;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setRepeatPattern: (pattern: "all" | "evenodd") => void;
  setSchedule: (schedule: WeeklySchedule | ((prev: WeeklySchedule) => WeeklySchedule)) => void;
  setAlternateSchedule: (schedule: WeeklySchedule | ((prev: WeeklySchedule) => WeeklySchedule)) => void;
}

export function useAvailabilityNavigation({
  colleague,
  setStartDate,
  setEndDate,
  setRepeatPattern,
  setSchedule,
  setAlternateSchedule,
}: UseAvailabilityNavigationProps) {
  // Get availability array from colleague settings
  const availability = Array.isArray(colleague.settings?.availability) 
    ? colleague.settings.availability 
    : colleague.settings?.availability 
      ? [colleague.settings.availability]
      : [];

  // Initialize currentEntryIndex to 0 if there are entries
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);

  // Load initial entry on mount
  useEffect(() => {
    if (availability.length > 0) {
      loadEntry(availability[0]);
    }
  }, []);

  const handlePrevEntry = () => {
    if (availability.length === 0 || currentEntryIndex <= 0) return;
    
    const newIndex = currentEntryIndex - 1;
    setCurrentEntryIndex(newIndex);
    loadEntry(availability[newIndex]);
  };

  const handleNextEntry = () => {
    if (availability.length === 0 || currentEntryIndex >= availability.length - 1) return;
    
    const newIndex = currentEntryIndex + 1;
    setCurrentEntryIndex(newIndex);
    loadEntry(availability[newIndex]);
  };

  const loadEntry = (entry: any) => {
    if (!entry) return;

    setStartDate(entry.startDate);
    setEndDate(entry.endDate || '');
    setRepeatPattern(entry.repeatPattern || "all");
    
    if (entry.weeklySchedule) {
      setSchedule(entry.weeklySchedule);
    }
    
    if (entry.alternateWeekSchedule) {
      setAlternateSchedule(entry.alternateWeekSchedule);
    }
  };

  return {
    currentEntryIndex,
    totalEntries: availability.length,
    handlePrevEntry,
    handleNextEntry,
  };
}