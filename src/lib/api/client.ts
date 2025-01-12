import { API_URL } from "./config";

export async function getSiteData(site: string) {
  try {
    const response = await fetch(`${API_URL}/sites/${site}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch site data: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching site data:", error);
    throw error;
  }
}
