import { API_URL } from "./config";

export interface OnDutyStaff {
  date: string;
  userId: string;
  name: string;
  email: string;
}

export async function getOnDutyStaff(site: string, date?: string): Promise<OnDutyStaff> {
  try {
    let url = `${API_URL}/on-duty/${site}`;
    
    if (date) {
      url += `?date=${date}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch on-duty staff: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching on-duty staff:", error);
    throw error;
  }
}

/**
 * Determines if a staff member is on duty based on the current time
 * On-duty period is from 8:00 AM until 7:59 AM the next day
 */
export function isOnDutyTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  // On duty starts at 8:00 AM
  return hour >= 8;
}

/**
 * Gets the date to use for on-duty lookup based on the current time
 * If current time is before 8:00 AM, use previous day's date
 */
export function getOnDutyDate(date: Date = new Date()): string {
  const onDutyDate = new Date(date);
  
  // If it's before 8:00 AM, we're still on the previous day's duty
  if (date.getHours() < 8) {
    onDutyDate.setDate(onDutyDate.getDate() - 1);
  }
  
  return onDutyDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}