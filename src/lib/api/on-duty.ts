import { apiClient } from './client';
import { User } from '../../types';

export interface OnDutyStaff {
  date: string;
  staff: User[];
}

export interface OnDutyResponse {
  onDutyStaff: OnDutyStaff[];
}

/**
 * Fetch on-duty staff data for a specific date range
 */
export async function getOnDutyStaff(
  token: string,
  startDate: string,
  endDate: string
): Promise<OnDutyResponse> {
  const response = await apiClient.get('/api/on-duty', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      startDate,
      endDate,
    },
  });

  return response.data;
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