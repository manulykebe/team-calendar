import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../types/user";
import { Event } from "../types/event";
import { getUsers } from "../lib/api/users";
import { getEvents } from "../lib/api/events";
import { getAvailabilityReport } from "../lib/api/report";
import { useAuth } from "./AuthContext";
import { userSettingsEmitter } from "../hooks/useColleagueSettings";
import toast from "react-hot-toast";

interface AppState {
  currentUser: User | null;
  colleagues: User[];
  events: Event[];
  availabilityData: Record<string, { am: boolean; pm: boolean }>;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppState>({
  currentUser: null,
  colleagues: [],
  events: [],
  availabilityData: {},
  isLoading: true,
  error: null,
  refreshData: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [colleagues, setColleagues] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [availabilityData, setAvailabilityData] = useState<Record<string, { am: boolean; pm: boolean }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const year = new Date().getFullYear().toString();
      
      // Use a separate try-catch for availability to not fail the entire load
      try {
        const report = await getAvailabilityReport(
          token,
          user.site,
          user.id,
          year
        );
        setAvailabilityData(report.availability);
      } catch (availabilityError) {
        console.warn("Failed to load availability data:", availabilityError);
        // Don't fail the entire load for availability issues
        setAvailabilityData({});
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
      setIsLoading(false);
      setError(null);
    }
  }, [token, loadAllData]);

  // Optimize availability change handling
  useEffect(() => {
    const handleAvailabilityChange = async () => {
      if (!token || !currentUser) return;

      try {
        // Debounce availability updates to prevent excessive API calls
        const year = new Date().getFullYear().toString();
        const report = await getAvailabilityReport(
          token,
          currentUser.site,
          currentUser.id,
          year
        );
        setAvailabilityData(report.availability);
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
  }, [token, currentUser]);

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
    isLoading,
    error,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);