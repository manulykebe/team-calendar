import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../types/user";
import { Event } from "../types/event";
import { Period } from "../types/period";
import { getUsers } from "../lib/api/users";
import { getEvents } from "../lib/api/events";
import { getAvailabilityReport } from "../lib/api/report";
import { getPeriods } from "../lib/api/periods";
import { useAuth } from "./AuthContext";
import { userSettingsEmitter } from "../hooks/useColleagueSettings";
import toast from "react-hot-toast";

interface AppState {
  currentUser: User | null;
  colleagues: User[];
  events: Event[];
  availabilityData: Record<string, { am: boolean; pm: boolean }>;
  periods: Period[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  loadAvailabilityForYear: (year: number) => Promise<void>;
  loadPeriodsForYear: (year: number) => Promise<void>;
}

const AppContext = createContext<AppState>({
  currentUser: null,
  colleagues: [],
  events: [],
  availabilityData: {},
  periods: [],
  isLoading: true,
  error: null,
  refreshData: async () => {},
  loadAvailabilityForYear: async () => {},
  loadPeriodsForYear: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [colleagues, setColleagues] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [availabilityData, setAvailabilityData] = useState<Record<string, { am: boolean; pm: boolean }>>({});
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which years have been loaded to avoid duplicate requests
  const [loadedYears, setLoadedYears] = useState<Set<number>>(new Set());
  const [loadedPeriodYears, setLoadedPeriodYears] = useState<Set<number>>(new Set());

  // Function to load availability data for a specific year
  const loadAvailabilityForYear = useCallback(async (year: number) => {
    console.log(`[loadAvailabilityForYear] Called for year ${year}`);
    console.log(`[loadAvailabilityForYear] Already loaded years:`, Array.from(loadedYears));

    if (!token || !currentUser) {
      console.log(`[loadAvailabilityForYear] Skipping: no token or currentUser`);
      return;
    }

    if (loadedYears.has(year)) {
      console.log(`[loadAvailabilityForYear] Year ${year} already loaded, skipping`);
      return;
    }

    try {
      console.log(`[loadAvailabilityForYear] Fetching availability for year ${year}...`);
      const report = await getAvailabilityReport(
        token,
        currentUser.site,
        currentUser.id,
        year.toString()
      );

      console.log(`[loadAvailabilityForYear] Received ${Object.keys(report.availability).length} dates for year ${year}`);
      console.log(`[loadAvailabilityForYear] Sample dates:`, Object.keys(report.availability).slice(0, 5));

      // Merge new availability data with existing data
      setAvailabilityData(prev => {
        const merged = {
          ...prev,
          ...report.availability
        };
        console.log(`[loadAvailabilityForYear] Total dates in availabilityData after merge:`, Object.keys(merged).length);
        return merged;
      });

      // Mark this year as loaded
      setLoadedYears(prev => new Set(prev).add(year));
      console.log(`[loadAvailabilityForYear] Year ${year} marked as loaded`);
    } catch (error) {
      console.error(`[loadAvailabilityForYear] Failed to load availability data for year ${year}:`, error);
    }
  }, [token, currentUser, loadedYears]);

  // Function to load periods data for a specific year
  const loadPeriodsForYear = useCallback(async (year: number) => {
    if (!token || !currentUser || loadedPeriodYears.has(year)) {
      return; // Already loaded or can't load
    }

    try {
      const periodsData = await getPeriods(token, currentUser.site, year);

      // Merge new periods with existing periods, removing duplicates
      setPeriods(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPeriods = periodsData.periods.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPeriods];
      });

      // Mark this year as loaded
      setLoadedPeriodYears(prev => new Set(prev).add(year));
    } catch (error) {
      console.warn(`Failed to load periods for year ${year}:`, error);
    }
  }, [token, currentUser, loadedPeriodYears]);

  // Function to fetch events for all users in the site (admin view)
  const fetchAllSiteEvents = useCallback(async (users: User[], token: string) => {
    const allEvents: Event[] = [];

    // Fetch events for each user in the site
    for (const user of users) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/events`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-User-Id': user.id, // Pass user ID to get their events
          },
        });

        if (response.ok) {
          const userEvents = await response.json();
          allEvents.push(...userEvents);
        }
      } catch (error) {
        console.warn(`Failed to fetch events for user ${user.id}:`, error);
      }
    }

    return allEvents;
  }, []);

  // Memoize the data loading function to prevent unnecessary re-renders
  const loadAllData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load users first
      const users = await getUsers(token);
      const userEmail = localStorage.getItem("userEmail");
      const user = users.find((u: User) => u.email === userEmail);

      if (!user) {
        throw new Error("Current user not found");
      }

      // Set current user
      setCurrentUser(user);
      
      // Filter out admin users from colleagues list
      const filteredColleagues = users.filter((u: User) => 
        u.id !== user.id && u.role !== "admin"
      );
      setColleagues(filteredColleagues);

      // Load events based on user role
      let eventsData: Event[] = [];
      
      if (user.role === 'admin') {
        // For admins, fetch events from all users in the site
        const siteUsers = users.filter((u: User) => u.site === user.site && u.role !== 'admin');
        eventsData = await fetchAllSiteEvents(siteUsers, token);
      } else {
        // For regular users, only fetch their own events
        eventsData = await getEvents(token);
      }
      
      setEvents(eventsData);

      // Fetch availability report for the current year
      const currentYear = new Date().getFullYear();

      // Use a separate try-catch for availability to not fail the entire load
      try {
        const report = await getAvailabilityReport(
          token,
          user.site,
          user.id,
          currentYear.toString()
        );
        setAvailabilityData(report.availability);
        // Mark current year as loaded
        setLoadedYears(new Set([currentYear]));
      } catch (availabilityError) {
        console.warn("Failed to load availability data:", availabilityError);
        // Don't fail the entire load for availability issues
        setAvailabilityData({});
        setLoadedYears(new Set());
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token, fetchAllSiteEvents]);

  // Load data when token changes
  useEffect(() => {
    if (token) {
      loadAllData();
    } else {
      // Reset state when no token
      setCurrentUser(null);
      setColleagues([]);
      setEvents([]);
      setAvailabilityData({});
      setLoadedYears(new Set());
      setIsLoading(false);
      setError(null);
    }
  }, [token, loadAllData]);

  // Optimize availability change handling
  useEffect(() => {
    const handleAvailabilityChange = async () => {
      if (!token || !currentUser) return;

      try {
        // When availability changes, reload all years that were previously loaded
        const yearsToReload = Array.from(loadedYears);
        const availabilityPromises = yearsToReload.map(year =>
          getAvailabilityReport(
            token,
            currentUser.site,
            currentUser.id,
            year.toString()
          )
        );

        const reports = await Promise.all(availabilityPromises);

        // Merge all availability data
        const mergedAvailability = reports.reduce((acc, report) => ({
          ...acc,
          ...report.availability
        }), {});

        setAvailabilityData(mergedAvailability);
      } catch (err) {
        console.error("Failed to update availability data:", err);
      }
    };

    // Debounce the availability change handler
    let timeoutId: NodeJS.Timeout;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleAvailabilityChange, 300);
    };

    userSettingsEmitter.on("availabilityChanged", debouncedHandler);
    
    return () => {
      clearTimeout(timeoutId);
      userSettingsEmitter.off("availabilityChanged", debouncedHandler);
    };
  }, [token, currentUser, loadedYears]);

  // Provide a way to refresh data without affecting calendar view
  const refreshData = useCallback(async () => {
    if (!token) return;

    try {
      // Only refresh events and users, don't change loading state
      // This prevents the calendar from jumping around
      const users = await getUsers(token);
      const userEmail = localStorage.getItem("userEmail");
      const user = users.find((u: User) => u.email === userEmail);

      if (user) {
        setCurrentUser(user);
        
        // Filter out admin users from colleagues list
        const filteredColleagues = users.filter((u: User) => 
          u.id !== user.id && u.role !== "admin"
        );
        setColleagues(filteredColleagues);
        
        // Load events based on user role
        let eventsData: Event[] = [];
        
        if (user.role === 'admin') {
          // For admins, fetch events from all users in the site
          const siteUsers = users.filter((u: User) => u.site === user.site && u.role !== 'admin');
          eventsData = await fetchAllSiteEvents(siteUsers, token);
        } else {
          // For regular users, only fetch their own events
          eventsData = await getEvents(token);
        }
        
        setEvents(eventsData);
      }
    } catch (err) {
      console.error("Failed to refresh data:", err);
      // Don't show error toast for background refreshes
    }
  }, [token, fetchAllSiteEvents]);

  const value = {
    currentUser,
    colleagues,
    events,
    availabilityData,
    periods,
    isLoading,
    error,
    refreshData,
    loadAvailabilityForYear,
    loadPeriodsForYear,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);