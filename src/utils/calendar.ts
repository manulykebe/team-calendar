import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

const DAYS_IN_WEEK = 7;
const WEEKDAYS = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
} as const;

type WeekDay = keyof typeof WEEKDAYS;

export function getCalendarDays(currentMonth: Date, weekStartsOn: WeekDay = 'Sunday') {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDay = WEEKDAYS[weekStartsOn];
  const firstDayIndex = (DAYS_IN_WEEK + getDay(monthStart) - startDay) % DAYS_IN_WEEK;

  return {
    days,
    emptyDays: firstDayIndex,
    weekDays: getWeekDays(weekStartsOn)
  };
}

function getWeekDays(weekStartsOn: WeekDay): string[] {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startIndex = WEEKDAYS[weekStartsOn];
  return [...weekDays.slice(startIndex), ...weekDays.slice(0, startIndex)];
}