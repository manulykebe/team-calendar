import {
  startOfWeek,
  addWeeks,
  eachDayOfInterval,
  getDay,
  subWeeks,
  addDays,
} from "date-fns";

const DAYS_IN_WEEK = 7;
const WEEKS_TO_SHOW = 5;
const WEEKDAYS = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
} as const;

type WeekDay = keyof typeof WEEKDAYS;

export function getCalendarDays(
  currentDate: Date,
  weekStartsOn: WeekDay = "Monday",
) {
  const startDay = WEEKDAYS[weekStartsOn];

  // Find the start of the week for the current date
  const weekStart = startOfWeek(currentDate, { weekStartsOn: startDay });

  // Calculate the start date (2 weeks before) and end date (2 weeks after)
  const calendarStart = subWeeks(weekStart, 2);
  const calendarEnd = addDays(addWeeks(weekStart, 2), 6);

  // Get all days in the interval
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return {
    days,
    emptyDays: 0, // No empty days needed since we're showing continuous weeks
    weekDays: getWeekDays(weekStartsOn),
  };
}

function getWeekDays(weekStartsOn: WeekDay): string[] {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const startIndex = WEEKDAYS[weekStartsOn];
  return [...weekDays.slice(startIndex), ...weekDays.slice(0, startIndex)];
}
