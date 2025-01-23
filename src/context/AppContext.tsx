import { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types/user";
import { Event } from "../types/event";
import { getUsers, getEvents } from "../lib/api";
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

  const loadAllData = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load data in parallel for better performance
      const [users, eventsData] = await Promise.all([
        getUsers(token),
        getEvents(token)
      ]);

      const userEmail = localStorage.getItem("userEmail");
      const user = users.find((u: User) => u.email === userEmail);

      if (!user) {
        throw new Error("Current user not found");
      }

      // Set current user and colleagues
      setCurrentUser(user);
      setColleagues(users.filter((u:User) => u.id !== user.id));
      setEvents(eventsData);

      // Fetch availability report for the current year
      const year = new Date().getFullYear().toString();
      const report = await getAvailabilityReport(
        token,
        user.site,
        user.id,
        year
      );
      setAvailabilityData(report.availability);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when token changes
  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  // Listen for availability changes
  useEffect(() => {
    const handleAvailabilityChange = async () => {
      if (!token || !currentUser) return;

      try {
        // Fetch updated availability data
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

    userSettingsEmitter.on("availabilityChanged", handleAvailabilityChange);
    return () => {
      userSettingsEmitter.off("availabilityChanged", handleAvailabilityChange);
    };
  }, [token, currentUser]);

  // Provide a way to refresh data
  const refreshData = async () => {
    await loadAllData();
  };

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