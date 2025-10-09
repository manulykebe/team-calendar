import { API_URL } from "./config";

export interface CalendarReportDay {
  date: string;
  day: number;
  month: number;
  year: number;
  dayOfWeek: string;
  availability: {
    am: boolean;
    pm: boolean;
  };
}

export interface CalendarReportWeek {
  weekNumber: number;
  days: CalendarReportDay[];
}

export interface CalendarReportData {
  year: string;
  userId: string;
  userName: string;
  weekStartsOn: string;
  workWeekDays: string[];
  dayParts: string[];
  weeks: CalendarReportWeek[];
  dateRange: {
    start: string;
    end: string;
  };
}

export async function getCalendarReport(
  token: string,
  site: string,
  userId: string,
  year: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarReportData> {
  const url = new URL(`${API_URL}/calendar-report/calendar/${site}/${userId}/${year}`);

  if (startDate) {
    url.searchParams.append("startDate", startDate);
  }
  if (endDate) {
    url.searchParams.append("endDate", endDate);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch calendar report" }));
    throw new Error(error.message);
  }

  return response.json();
}
