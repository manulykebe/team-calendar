import { API_URL } from "./config";
import { holidaysCache, getCacheKey } from "./cache";

export interface Holiday {
  date: string;
  name: string;
  type: "public";
}

export async function getHolidays(
  year: string,
  location: string = "BE",
): Promise<Holiday[]> {
  const cacheKey = getCacheKey.holidays(year, location);
  
  // Check cache first
  const cached = holidaysCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${API_URL}/holidays/${year}?location=${location}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch holidays: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    holidaysCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error("Error fetching holidays:", error);
    throw error;
  }
}