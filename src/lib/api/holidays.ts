export interface Holiday {
  date: string;
  name: string;
  type: 'public';
}

export async function getHolidays(year: string, location: string = 'BE'): Promise<Holiday[]> {
  const response = await fetch(`http://localhost:3000/api/holidays/${year}?location=${location}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch holidays');
  }
  
  const data = await response.json();
  return data;
}