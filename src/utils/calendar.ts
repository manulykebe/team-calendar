import {
  startOfWeek,
  addWeeks,
  eachDayOfInterval,
  getDay,
  subWeeks,
  addDays,
  format,
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

  const weeksBeforeStartDate = 1;
  const weeksAfterStartDate = 3;

  // Calculate the start date (x? weeks before) and end date (x? weeks after) 
  const calendarStart = subWeeks(weekStart, weeksBeforeStartDate);
  const calendarEnd = addDays(addWeeks(weekStart, weeksAfterStartDate), 6);

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

// Format date with localization support
export function formatDateWithLocale(date: Date, formatString: string, locale: string): string {
  // This is a simplified implementation
  // In a real app, you would use a library like date-fns/locale or Intl.DateTimeFormat
  
  // For month names
  if (formatString === "MMMM") {
    const monthIndex = date.getMonth();
    const months = {
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
      nl: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
    };
    
    return (months as any)[locale]?.[monthIndex] || format(date, formatString);
  }
  
  // For abbreviated month names
  if (formatString === "MMM") {
    const monthIndex = date.getMonth();
    const months = {
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
      nl: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
    };
    
    return (months as any)[locale]?.[monthIndex] || format(date, formatString);
  }
  
  // For day names
  if (formatString === "EEEE") {
    const dayIndex = date.getDay();
    const days = {
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      nl: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
    };
    
    return (days as any)[locale]?.[dayIndex] || format(date, formatString);
  }
  
  // For other formats, fall back to the default formatter
  return format(date, formatString);
}