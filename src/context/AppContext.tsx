import { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types/user";
import { Event } from "../types/event";
import { getUsers, getEvents } from "../lib/api";
import { getAvailabilityReport } from "../lib/api/report";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

/*

const { currentUser, colleagues, events, availabilityData } = useApp();

const { refreshData } = useApp();
await refreshData();


const { isLoading } = useApp();
if (isLoading) {
  return <LoadingSpinner />;
}



*/

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
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch users and identify current user
      const users = await getUsers(token);
      const userEmail = localStorage.getItem("userEmail");
      const user = users.find((u) => u.email === userEmail);

      if (!user) {
        throw new Error("Current user not found");
      }

      // 2. Set current user and colleagues
      setCurrentUser(user);
      setColleagues(users.filter((u) => u.id !== user.id));

      // 3. Fetch events
      const eventsData = await getEvents(token);
      setEvents(eventsData);

      // 4. Fetch availability report for the current year
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

  // Initial data load when token is available
  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const value = {
    currentUser,
    colleagues,
    events,
    availabilityData,
    isLoading,
    error,
    refreshData: loadAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);