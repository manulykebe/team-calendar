import { API_URL } from "./config";
import { WeeklySchedule } from "../types/availability";

interface ScheduleData {
  weeklySchedule: WeeklySchedule;
  alternateWeekSchedule?: WeeklySchedule;
  startDate: string;
  endDate: string;
  repeatPattern: "all" | "evenodd";
}

export async function addSchedule(
  token: string,
  userId: string,
  scheduleData: ScheduleData,
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      settings: {
        availability: [scheduleData],
      },
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to add schedule" }));
    throw new Error(error.message);
  }

  return response.json();
}

export async function updateSchedule(
  token: string,
  userId: string,
  scheduleIndex: number,
  scheduleData: ScheduleData,
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      settings: {
        availability: {
          [scheduleIndex]: scheduleData,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update schedule" }));
    throw new Error(error.message);
  }

  return response.json();
}

export async function deleteSchedule(
  token: string,
  userId: string,
  scheduleIndex: number,
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      settings: {
        availability: {
          $remove: scheduleIndex,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to delete schedule" }));
    throw new Error(error.message);
  }

  return response.json();
}

export async function reorderSchedules(
  token: string,
  userId: string,
  schedules: ScheduleData[],
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      settings: {
        availability: schedules,
      },
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to reorder schedules" }));
    throw new Error(error.message);
  }

  return response.json();
}
