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

// Helper function to translate holiday names - standalone function
export function translateHolidayName(holidayName: string, language: string = 'nl'): string {
  // Import translations directly to avoid hook dependency
  const translations = {
    nl: {
      'New Year\'s Day': 'Nieuwjaarsdag',
      'Easter Sunday': 'Paaszondag',
      'Easter Monday': 'Paasmaandag',
      'Labour Day': 'Dag van de Arbeid',
      'Ascension Day': 'Hemelvaartsdag',
      'Whit Sunday': 'Pinksteren',
      'Whit Monday': 'Pinkstermaandag',
      'Belgian National Day': 'Belgische Nationale Feestdag',
      'Assumption Day': 'Maria-Tenhemelopneming',
      'All Saints\' Day': 'Allerheiligen',
      'Armistice Day': 'Wapenstilstand',
      'Christmas Day': 'Kerstmis',
      'Good Friday': 'Goede Vrijdag',
      'Early May Bank Holiday': 'Vroege mei-feestdag',
      'Spring Bank Holiday': 'Lentefeestdag',
      'Summer Bank Holiday': 'Zomerfeestdag',
      'Boxing Day': 'Tweede Kerstdag',
    },
    fr: {
      'New Year\'s Day': 'Jour de l\'An',
      'Easter Sunday': 'Dimanche de Pâques',
      'Easter Monday': 'Lundi de Pâques',
      'Labour Day': 'Fête du Travail',
      'Ascension Day': 'Ascension',
      'Whit Sunday': 'Pentecôte',
      'Whit Monday': 'Lundi de Pentecôte',
      'Belgian National Day': 'Fête Nationale Belge',
      'Assumption Day': 'Assomption',
      'All Saints\' Day': 'Toussaint',
      'Armistice Day': 'Armistice',
      'Christmas Day': 'Noël',
      'Good Friday': 'Vendredi Saint',
      'Early May Bank Holiday': 'Jour férié de début mai',
      'Spring Bank Holiday': 'Jour férié de printemps',
      'Summer Bank Holiday': 'Jour férié d\'été',
      'Boxing Day': 'Lendemain de Noël',
    },
    en: {
      'New Year\'s Day': 'New Year\'s Day',
      'Easter Sunday': 'Easter Sunday',
      'Easter Monday': 'Easter Monday',
      'Labour Day': 'Labour Day',
      'Ascension Day': 'Ascension Day',
      'Whit Sunday': 'Whit Sunday',
      'Whit Monday': 'Whit Monday',
      'Belgian National Day': 'Belgian National Day',
      'Assumption Day': 'Assumption Day',
      'All Saints\' Day': 'All Saints\' Day',
      'Armistice Day': 'Armistice Day',
      'Christmas Day': 'Christmas Day',
      'Good Friday': 'Good Friday',
      'Early May Bank Holiday': 'Early May Bank Holiday',
      'Spring Bank Holiday': 'Spring Bank Holiday',
      'Summer Bank Holiday': 'Summer Bank Holiday',
      'Boxing Day': 'Boxing Day',
    }
  };

  const holidayMap: Record<string, string> = {
    ...(translations as any)[language] || translations.en
  };

  return holidayMap[holidayName] || holidayName;
}