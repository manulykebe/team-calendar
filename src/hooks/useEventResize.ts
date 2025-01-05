import { useState, useCallback } from 'react';
import { addDays, parseISO, format } from 'date-fns';

interface UseEventResizeProps {
  onResize: (newDate: string, newEndDate?: string) => Promise<void>;
  date: string;
  endDate?: string;
}

export function useEventResize({ onResize, date, endDate }: UseEventResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<'left' | 'right' | null>(null);
  const [originalDate, setOriginalDate] = useState<string | null>(null);
  const [originalEndDate, setOriginalEndDate] = useState<string | null>(null);

  const handleResizeStart = useCallback((edge: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeEdge(edge);
    setOriginalDate(date);
    setOriginalEndDate(endDate);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !originalDate) return;

      // Calculate days moved based on mouse movement
      const dayWidth = 100; // Approximate width of a day cell in pixels
      const deltaX = e.movementX;
      const daysDelta = Math.round(deltaX / dayWidth);

      if (daysDelta === 0) return;

      const startDate = parseISO(originalDate);
      const currentEndDate = endDate ? parseISO(endDate) : startDate;

      if (resizeEdge === 'left') {
        const newDate = format(addDays(startDate, daysDelta), 'yyyy-MM-dd');
        onResize(newDate, format(currentEndDate, 'yyyy-MM-dd'));
      } else {
        const newEndDate = format(addDays(currentEndDate, daysDelta), 'yyyy-MM-dd');
        onResize(originalDate, newEndDate);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeEdge(null);
      setOriginalDate(null);
      setOriginalEndDate(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [date, endDate, isResizing, onResize]);

  return {
    handleResizeStart,
    isResizing,
    resizeEdge
  };
}