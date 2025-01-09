import { API_URL } from './config';

export async function getSiteData(site: string) {
  const response = await fetch(`${API_URL}/sites/${site}`);
  if (!response.ok) {
    throw new Error('Failed to fetch site data');
  }
  return response.json();
}