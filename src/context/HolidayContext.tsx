import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { getHolidays, Holiday } from '../lib/api/holidays';
import { getSiteData } from '../lib/api/client';
import { format, parseISO, isValid } from 'date-fns';

interface HolidayContextType {
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
  loadHolidays: (year: string | number) => Promise<Holiday[]>;
  isPublicHoliday: (date: Date | string) => boolean;
}

const HolidayContext = createContext<HolidayContextType>({
  holidays: [],
  loading: false,
  error: null,
  loadHolidays: async () => [],
  isPublicHoliday: () => false
});

// Create a global cache for holidays to avoid redundant API calls
const holidayCache: Record<string, Holiday[]> = {};

export function HolidayProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { currentUser } = useApp();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load holidays based on the current user's site location
  const loadHolidays = async (year: string | number) => {
    if (!token || !currentUser?.site) {
      return [];
    }

    const cacheKey = `${currentUser.site}-${year}`;
    
    // Return cached holidays if available
    if (holidayCache[cacheKey]) {
      setHolidays(holidayCache[cacheKey]);
      return holidayCache[cacheKey];
    }

    setLoading(true);
    setError(null);

    try {
      // Get site data to determine location (BE, GB, etc.)
      const siteData = await getSiteData(currentUser.site);
      const location = siteData?.app?.location || 'BE'; // Default to BE if not specified
      
      // Fetch holidays for the specified year and location
      const holidayData = await getHolidays(year.toString(), location);
      
      // Cache the holidays
      holidayCache[cacheKey] = holidayData;
      
      setHolidays(holidayData);
      return holidayData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load holidays';
      setError(errorMessage);
      console.error('Error loading holidays:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load current year holidays on mount
  useEffect(() => {
    if (token && currentUser) {
      const currentYear = new Date().getFullYear();
      loadHolidays(currentYear);
    }
  }, [token, currentUser]);

  // Check if a date is a public holiday
  const isPublicHoliday = (date: Date | string): boolean => {
    try {
      // Normalize the date to a string format
      let dateStr: string;
      
      if (typeof date === 'string') {
        // Validate the string date
        const parsedDate = parseISO(date);
        if (!isValid(parsedDate)) {
          return false;
        }
        dateStr = format(parsedDate, 'yyyy-MM-dd');
      } else if (date instanceof Date) {
        // Validate the Date object
        if (!isValid(date)) {
          return false;
        }
        dateStr = format(date, 'yyyy-MM-dd');
      } else {
        return false;
      }

      // Check if the date is in the holidays array
      return holidays.some(holiday => holiday.date === dateStr);
    } catch (error) {
      console.warn('Error checking if date is a public holiday:', error);
      return false;
    }
  };

  return (
    <HolidayContext.Provider value={{ 
      holidays, 
      loading, 
      error, 
      loadHolidays,
      isPublicHoliday
    }}>
      {children}
    </HolidayContext.Provider>
  );
}

export const useHolidays = () => useContext(HolidayContext);

// Export a standalone function that can be used without the context
export function isPublicHoliday(
  date: Date | string,
  holidays?: Holiday[] | Map<string, Holiday>
): boolean {
  if (!holidays || (Array.isArray(holidays) && holidays.length === 0) || 
      (holidays instanceof Map && holidays.size === 0)) {
    return false;
  }

  try {
    // Normalize the date to a string format
    let dateStr: string;
    
    if (typeof date === 'string') {
      // Validate the string date
      const parsedDate = parseISO(date);
      if (!isValid(parsedDate)) {
        return false;
      }
      dateStr = format(parsedDate, 'yyyy-MM-dd');
    } else if (date instanceof Date) {
      // Validate the Date object
      if (!isValid(date)) {
        return false;
      }
      dateStr = format(date, 'yyyy-MM-dd');
    } else {
      return false;
    }

    // Check if the date is in the holidays map or array
    if (holidays instanceof Map) {
      return holidays.has(dateStr);
    } else if (Array.isArray(holidays)) {
      return holidays.some(holiday => holiday.date === dateStr);
    }

    return false;
  } catch (error) {
    console.warn('Error checking if date is a public holiday:', error);
    return false;
  }
}