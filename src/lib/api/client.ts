import { API_URL } from "./config";
import { siteDataCache, getCacheKey } from "./cache";

export async function getSiteData(site: string) {
  const cacheKey = getCacheKey.siteData(site);
  
  // Check cache first
  const cached = siteDataCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`${API_URL}/sites/${site}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch site data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    siteDataCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error("Error fetching site data:", error);
    throw error;
  }
}