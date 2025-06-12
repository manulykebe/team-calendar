import { SimpleCache } from "../../utils/performance";

// Create cache instances for different types of data
export const holidaysCache = new SimpleCache<any>(60); // 60 minutes TTL
export const siteDataCache = new SimpleCache<any>(30); // 30 minutes TTL
export const usersCache = new SimpleCache<any>(10); // 10 minutes TTL
export const eventsCache = new SimpleCache<any>(5); // 5 minutes TTL

// Cache key generators
export const getCacheKey = {
  holidays: (year: string, location: string) => `holidays-${location}-${year}`,
  siteData: (site: string) => `site-${site}`,
  users: (token: string) => `users-${token.slice(-8)}`, // Use last 8 chars of token
  events: (token: string) => `events-${token.slice(-8)}`,
  availability: (site: string, userId: string, year: string) => 
    `availability-${site}-${userId}-${year}`,
};

// Helper function to clear related caches
export function clearUserRelatedCaches(token: string) {
  const tokenSuffix = token.slice(-8);
  usersCache.clear();
  eventsCache.clear();
  // Note: We don't clear holidays and site data as they're less user-specific
}

// Helper function to invalidate specific cache entries
export function invalidateCache(type: keyof typeof getCacheKey, ...args: string[]) {
  switch (type) {
    case 'holidays':
      holidaysCache.clear();
      break;
    case 'siteData':
      siteDataCache.clear();
      break;
    case 'users':
      usersCache.clear();
      break;
    case 'events':
      eventsCache.clear();
      break;
  }
}