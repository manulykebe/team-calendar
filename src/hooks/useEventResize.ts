import { useState, useCallback } from 'react';
import { addDays, parseISO, format, isBefore } from 'date-fns';

interface UseEventResizeProps {
  onResize: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
  date: string;
  endDate?: string;
  eventId: string;
}

export function useEventResize({ onResize, date, endDate, eventId }: UseEventResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [initialX, setInitialX] = useState(0);
  const [initialDate, setInitialDate] = useState<string | null>(null);
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null);

  const handleResizeStart = useCallback((edge: 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeEdge(edge);
    setInitialX(e.clientX);
    setInitialDate(date);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !initialDate) return;

      const deltaX = e.clientX - initialX;
      const dayWidth = 100; // Approximate width of a day cell
      const daysDelta = Math.round(deltaX / dayWidth);

      if (daysDelta === 0) return;

      const startDate = parseISO(initialDate);
      const currentEndDate = endDate ? parseISO(endDate) : startDate;

      if (edge === 'start') {
        const newStartDate = addDays(startDate, daysDelta);
        // Ensure new start date is not after end date
        if (endDate && isBefore(newStartDate, parseISO(endDate))) {
          onResize(eventId, format(newStartDate, 'yyyy-MM-dd'), endDate);
        }
      } else {
        const newEndDate = addDays(currentEndDate, daysDelta);
        // Ensure new end date is not before start date
        if (isBefore(parseISO(date), newEndDate)) {
          onResize(eventId, date, format(newEndDate, 'yyyy-MM-dd'));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeEdge(null);
      setInitialX(0);
      setInitialDate(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [date, endDate, eventId, isResizing, onResize]);

  return {
    isResizing,
    resizeEdge,
    handleResizeStart
  };
}