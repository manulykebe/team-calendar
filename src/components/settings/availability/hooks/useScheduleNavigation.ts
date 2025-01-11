import { useState } from 'react';
import { addDays, subDays, parseISO } from 'date-fns';
import { User } from '../../../../types/user';
import { WeeklySchedule } from '../../../../types/availability';
import { useAvailabilityValidation } from './useAvailabilityValidation';

interface UseScheduleNavigationProps {
  colleague: User;
  currentEntryIndex: number;
  setCurrentEntryIndex: (index: number) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSchedule: (schedule: WeeklySchedule) => void;
  setAlternateSchedule: (schedule: WeeklySchedule) => void;
  setError: (error: string) => void;
}

const createDefaultSchedule = (): WeeklySchedule => ({
  Monday: { am: true, pm: true },
  Tuesday: { am: true, pm: true },
  Wednesday: { am: true, pm: true },
  Thursday: { am: true, pm: true },
  Friday: { am: true, pm: true },
});

export function useScheduleNavigation({
  colleague,
  currentEntryIndex,
  setCurrentEntryIndex,
  setStartDate,
  setEndDate,
  setSchedule,
  setAlternateSchedule,
  setError,
}: UseScheduleNavigationProps) {
  // Get the availability array directly
  const availability = colleague.settings?.availability || [];

  const { validateSchedule } = useAvailabilityValidation();

  const handleDelete = async (extendPreceding: boolean) => {
    if (currentEntryIndex === -1) return;

    const newAvailability = [...availability];
    const deletedEntry = newAvailability[currentEntryIndex];

    if (currentEntryIndex > 0 && extendPreceding) {
      // Extend preceding schedule
      newAvailability[currentEntryIndex - 1].endDate = deletedEntry.endDate;
    } else if (currentEntryIndex < newAvailability.length - 1 && !extendPreceding) {
      // Extend following schedule
      newAvailability[currentEntryIndex + 1].startDate = deletedEntry.startDate;
    }

    // Remove the current entry
    newAvailability.splice(currentEntryIndex, 1);

    // Validate the new schedule arrangement
    for (let i = 0; i < newAvailability.length; i++) {
      const validation = validateSchedule(
        newAvailability[i].startDate,
        newAvailability[i].endDate,
        i,
        newAvailability.length,
        newAvailability
      );

      if (!validation.isValid) {
        setError(validation.error || 'Invalid schedule arrangement');
        return;
      }
    }
    
    // Update colleague settings
    const updatedSettings = {
      ...colleague.settings,
      availability: newAvailability,
    };

    // Navigate to previous entry or reset to new
    if (currentEntryIndex > 0) {
      setCurrentEntryIndex(currentEntryIndex - 1);
      loadEntry(newAvailability[currentEntryIndex - 1]);
    } else {
      resetToNew();
    }
  };

  const handleAdd = async (atStart: boolean) => {
    const newEntry = {
      weeklySchedule: createDefaultSchedule(),
      alternateWeekSchedule: createDefaultSchedule(),
      startDate: '',
      endDate: '',
      repeatPattern: 'all' as const,
    };

    if (atStart) {
      // Add at start
      if (availability.length > 0) {
        newEntry.endDate = subDays(parseISO(availability[0].startDate), 1).toISOString().split('T')[0];
        newEntry.startDate = subDays(parseISO(newEntry.endDate), 7).toISOString().split('T')[0];
      } else {
        const today = new Date();
        newEntry.startDate = today.toISOString().split('T')[0];
        newEntry.endDate = addDays(today, 7).toISOString().split('T')[0];
      }
    } else {
      // Add at end
      if (availability.length > 0) {
        const lastEntry = availability[availability.length - 1];
        newEntry.startDate = addDays(parseISO(lastEntry.endDate || lastEntry.startDate), 1).toISOString().split('T')[0];
        // Last entry doesn't require an end date
        newEntry.endDate = '';
      } else {
        const today = new Date();
        newEntry.startDate = today.toISOString().split('T')[0];
        // Last entry doesn't require an end date
        newEntry.endDate = '';
      }
    }

    // Validate the new entry
    const validation = validateSchedule(
      newEntry.startDate,
      newEntry.endDate,
      atStart ? 0 : availability.length,
      availability.length + 1,
      [...(atStart ? [newEntry] : []), ...availability, ...(atStart ? [] : [newEntry])]
    );

    if (!validation.isValid) {
      setError(validation.error || 'Invalid schedule arrangement');
      return;
    }

    loadEntry(newEntry);
  };

  const handleSplit = async (splitDate: string) => {
    if (currentEntryIndex === -1) return;

    const currentEntry = availability[currentEntryIndex];
    const firstHalf = {
      ...currentEntry,
      endDate: splitDate,
    };

    const secondHalf = {
      ...currentEntry,
      startDate: addDays(parseISO(splitDate), 1).toISOString().split('T')[0],
      // If this was the last entry, the second half becomes the new last entry
      endDate: currentEntryIndex === availability.length - 1 ? '' : currentEntry.endDate,
    };

    const newAvailability = [
      ...availability.slice(0, currentEntryIndex),
      firstHalf,
      secondHalf,
      ...availability.slice(currentEntryIndex + 1),
    ];

    // Validate both new entries
    const validation1 = validateSchedule(
      firstHalf.startDate,
      firstHalf.endDate,
      currentEntryIndex,
      newAvailability.length,
      newAvailability
    );

    const validation2 = validateSchedule(
      secondHalf.startDate,
      secondHalf.endDate,
      currentEntryIndex + 1,
      newAvailability.length,
      newAvailability
    );

    if (!validation1.isValid) {
      setError(validation1.error || 'Invalid first half of split');
      return;
    }

    if (!validation2.isValid) {
      setError(validation2.error || 'Invalid second half of split');
      return;
    }

    // Update colleague settings
    const updatedSettings = {
      ...colleague.settings,
      availability: newAvailability,
    };

    // Load the first half of the split
    loadEntry(firstHalf);
  };

  const loadEntry = (entry: any) => {
    if (!entry) return;

    setStartDate(entry.startDate);
    setEndDate(entry.endDate || '');
    setSchedule(entry.weeklySchedule || createDefaultSchedule());
    setAlternateSchedule(entry.alternateWeekSchedule || createDefaultSchedule());
  };

  const resetToNew = () => {
    setStartDate('');
    setEndDate('');
    setSchedule(createDefaultSchedule());
    setAlternateSchedule(createDefaultSchedule());
  };

  return {
    handleDelete,
    handleAdd,
    handleSplit,
  };
}