import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteEvent } from '../lib/api';
import { getErrorMessage } from '../utils/error';

export function useEventDeletion() {
  const { token } = useAuth();

  const handleEventDelete = useCallback(async (
    eventId: string,
    onSuccess?: (eventId: string) => void
  ) => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      await deleteEvent(token, eventId);
      onSuccess?.(eventId);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Failed to delete event:', message);
      throw new Error(message);
    }
  }, [token]);

  return { handleEventDelete };
}