import { API_URL } from "./config";

export interface OnDutyStaff {
  date: string;
  userId: string;
  name: string;
  email: string;
  mobile: string;
  from: string; // Format: YYYY-MM-DD HH:mm
  to: string;   // Format: YYYY-MM-DD HH:mm 
}

export async function getOnDutyStaff(site: string, date?: string): Promise<OnDutyStaff | null> {
  const url = `${API_URL}/on-duty/${encodeURIComponent(site)}${date ? `?date=${encodeURIComponent(date)}` : ""}`;
  const res = await fetch(url, { credentials: "same-origin" });

  // 204 -> no content, treat as "no on-duty data"
  if (res.status === 204) return null;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch on-duty staff: ${res.status}`);
  }

  // safe to parse JSON now
  const data = await res.json();
  return data as OnDutyStaff;
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
 * Get the current on-duty date based on the current time and site configuration
 */
export function getCurrentOnDutyDate(): string {
  const now = new Date();
  
  // If it's before 6 AM, consider it part of the previous day's duty
  if (now.getHours() < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  return now.toISOString().split('T')[0];
}

/**
 * Check if a user is on duty for a specific date
 */
export function isUserOnDuty(user: User, date: string, onDutyData: OnDutyStaff[]): boolean {
  const dayData = onDutyData.find(d => d.date === date);
  return dayData ? dayData.staff.some(staff => staff.id === user.id) : false;
}