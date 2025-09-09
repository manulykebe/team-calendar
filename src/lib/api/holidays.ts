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
export function translateHolidayName(holidayName: string): string {
  // Map of original holiday names to translation keys
  const { t } = useTranslation();
  const holidayMap: Record<string, string> = {
    // Belgian holidays
    'New Year\'s Day': t('publicHolidays.newYearsDay'),
    'Easter Sunday': t('publicHolidays.easterSunday'),
    'Easter Monday': t('publicHolidays.easterMonday'),
    'Labour Day': t('publicHolidays.labourDay'),
    'Ascension Day': t('publicHolidays.ascensionDay'),
    'Whit Sunday': t('publicHolidays.whitSunday'),
    'Whit Monday': t('publicHolidays.whitMonday'),
    'Belgian National Day': t('publicHolidays.belgianNationalDay'),
    'Assumption Day': t('publicHolidays.assumptionDay'),
    'All Saints\' Day': t('publicHolidays.allSaintsDay'),
    'Armistice Day': t('publicHolidays.armisticeDay'),
    'Christmas Day': t('publicHolidays.christmasDay'),

    // UK holidays
    'Good Friday': t('publicHolidays.goodFriday'),
    'Early May Bank Holiday': t('publicHolidays.earlyMayBankHoliday'),
    'Spring Bank Holiday': t('publicHolidays.springBankHoliday'),
    'Summer Bank Holiday': t('publicHolidays.summerBankHoliday'),
    'Boxing Day': t('publicHolidays.boxingDay'),
  };

  // Return the translated name if available, otherwise return the original name
  return holidayMap[holidayName] ? t(holidayMap[holidayName]) : holidayName;
}