import { API_URL } from './config';

export interface Holiday {
  date: string;
  name: string;
  type: 'public';
}

export async function getHolidays(year: string, location: string = 'BE'): Promise<Holiday[]> {
  try {
    const response = await fetch(`${API_URL}/holidays/${year}?location=${location}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch holidays: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching holidays:', error);
    throw error;
  }
}