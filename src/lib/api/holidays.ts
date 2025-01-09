export interface Holiday {
  date: string;
  name: string;
  type: 'public';
}

export async function getHolidays(year: string): Promise<Holiday[]> {
  const response = await fetch(`http://localhost:3000/api/holidays/${year}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch holidays');
  }
  
  return response.json();
}