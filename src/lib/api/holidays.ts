import { API_URL } from "./config";
import { holidaysCache, getCacheKey } from "./cache";
import { useTranslation } from "../../context/TranslationContext";

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

// Helper function to translate holiday names
export function translateHolidayName(holidayName: string, t: (key: string) => string): string {
  // Map of original holiday names to translation keys
  const holidayMap: Record<string, string> = {
    // Belgian holidays
    'BE New Year\'s Day': 'publicHolidays.newYearsDay',
    'Easter Sunday': 'publicHolidays.easterSunday',
    'Easter Monday': 'publicHolidays.easterMonday',
    'Labour Day': 'publicHolidays.labourDay',
    'Ascension Day': 'publicHolidays.ascensionDay',
    'Whit Sunday': 'publicHolidays.whitSunday',
    'Whit Monday': 'publicHolidays.whitMonday',
    'Belgian National Day': 'publicHolidays.belgianNationalDay',
    'Assumption Day': 'publicHolidays.assumptionDay',
    'All Saints\' Day': 'publicHolidays.allSaintsDay',
    'Armistice Day': 'publicHolidays.armisticeDay',
    'Christmas Day': 'publicHolidays.christmasDay',
    
    // UK holidays
    'GB New Year\'s Day': 'publicHolidays.newYearsDay',
    'Good Friday': 'publicHolidays.goodFriday',
    'Early May Bank Holiday': 'publicHolidays.earlyMayBankHoliday',
    'Spring Bank Holiday': 'publicHolidays.springBankHoliday',
    'Summer Bank Holiday': 'publicHolidays.summerBankHoliday',
    'Boxing Day': 'publicHolidays.boxingDay',
  };
  
  // Return the translated name if available, otherwise return the original name
  return holidayMap[holidayName] ? t(holidayMap[holidayName]) : holidayName;
}