/**
 * Calculate the ISO week number for a given date
 * @param date The date to get the week number for
 * @returns The ISO week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  // Copy date to prevent mutation
  const target = new Date(date.valueOf());
  
  // Find Thursday of this week starting on Monday
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  
  // Calculate first Thursday in year
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  
  // Calculate week number: Number of weeks from first Thursday
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}