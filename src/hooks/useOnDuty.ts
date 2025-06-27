import { useState, useEffect } from 'react';
import { getOnDutyStaff } from '../lib/api/on-duty';

/**
 * Hook to check if a user is on duty for a specific date
 * @param date The date to check (YYYY-MM-DD format)
 * @param userId The user ID to check
 * @returns Object with on-duty information
 */
export function useOnDuty(date: string, userId?: string) {
  const [onDutyUserId, setOnDutyUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOnDutyData = async () => {
      if (!date) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the site from localStorage (fallback to 'azjp')
        const site = localStorage.getItem('site') || 'azjp';
        
        const onDutyData = await getOnDutyStaff(site, date);
        setOnDutyUserId(onDutyData.userId);
      } catch (err) {
        console.error('Failed to fetch on-duty data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch on-duty data');
        setOnDutyUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnDutyData();
  }, [date]);

  // Check if the specified user is on duty
  const isUserOnDuty = userId && onDutyUserId === userId;

  return {
    onDutyUserId,
    isUserOnDuty,
    isLoading,
    error
  };
}