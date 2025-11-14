import { API_URL } from "./config";

export interface UserAvailability {
  userId: string;
  firstName: string;
  lastName: string;
  availability: Array<{
    weeklySchedule: {
      Monday: { am: boolean; pm: boolean };
      Tuesday: { am: boolean; pm: boolean };
      Wednesday: { am: boolean; pm: boolean };
      Thursday: { am: boolean; pm: boolean };
      Friday: { am: boolean; pm: boolean };
      Saturday?: { am: boolean; pm: boolean };
      Sunday?: { am: boolean; pm: boolean };
    };
    oddWeeklySchedule?: {
      Monday: { am: boolean; pm: boolean };
      Tuesday: { am: boolean; pm: boolean };
      Wednesday: { am: boolean; pm: boolean };
      Thursday: { am: boolean; pm: boolean };
      Friday: { am: boolean; pm: boolean };
      Saturday?: { am: boolean; pm: boolean };
      Sunday?: { am: boolean; pm: boolean };
    };
    startDate: string;
    endDate: string;
    repeatPattern: "all" | "evenodd";
  }>;
}

export async function getAllUsersAvailability(token: string): Promise<UserAvailability[]> {
  const response = await fetch(`${API_URL}/availability/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch availability data" }));
    throw new Error(error.message);
  }

  return response.json();
}
