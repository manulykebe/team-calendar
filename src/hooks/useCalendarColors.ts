import { useMemo } from 'react';
import { format } from 'date-fns';
import { User } from '../types/user';

const DEFAULT_COLORS = {
  Sunday: "#e0e0e0",
  Monday: "#ffffff",
  Tuesday: "#ffffff",
  Wednesday: "#ffffff",
  Thursday: "#ffffff",
  Friday: "#ffffff",
  Saturday: "#e0e0e0"
};

export function useCalendarColors(currentUser?: User | null) {
  return useMemo(() => {
    // Start with default colors
    const colors = { ...DEFAULT_COLORS };

    // Override with site-specific colors if available


    // Override with user-specific colors if available
    if (currentUser?.app?.color) {
      Object.assign(colors, currentUser.app.color);
    }

    return {
      getColumnColor: (date: Date) => {
        const dayName = format(date, 'EEEE') as keyof typeof colors;
        return colors[dayName];
      }
    };
  }, [currentUser]);
}