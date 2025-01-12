import { useState, useCallback, useRef } from "react";
import { addDays, parseISO, format, isBefore } from "date-fns";

interface UseEventResizeProps {
  eventId: string;
  date: string;
  endDate?: string;
  onResize: (
    eventId: string,
    newDate: string,
    newEndDate?: string,
  ) => Promise<void>;
}

export function useEventResize({
  eventId,
  date,
  endDate,
  onResize,
}: UseEventResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeDataRef = useRef<{
    startX: number;
    originalDate: string;
    originalEndDate?: string;
    edge: "start" | "end";
  } | null>(null);

  const handleResizeStart = useCallback(
    (edge: "start" | "end", e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onResize) return; // Guard against undefined onResize

      setIsResizing(true);
      resizeDataRef.current = {
        startX: e.clientX,
        originalDate: date,
        originalEndDate: endDate,
        edge,
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!resizeDataRef.current || !onResize) return;

        const deltaX = e.clientX - resizeDataRef.current.startX;
        const dayWidth = 100; // Approximate width of a day cell
        const daysDelta = Math.round(deltaX / dayWidth);

        if (daysDelta === 0) return;

        const originalDate = parseISO(resizeDataRef.current.originalDate);
        const originalEndDate = resizeDataRef.current.originalEndDate
          ? parseISO(resizeDataRef.current.originalEndDate)
          : originalDate;

        try {
          if (resizeDataRef.current.edge === "start") {
            const newStartDate = addDays(originalDate, daysDelta);
            if (!endDate || isBefore(newStartDate, parseISO(endDate))) {
              onResize(
                eventId,
                format(newStartDate, "yyyy-MM-dd"),
                format(originalEndDate, "yyyy-MM-dd"),
              );
            }
          } else {
            const newEndDate = addDays(originalEndDate, daysDelta);
            if (isBefore(parseISO(date), newEndDate)) {
              onResize(
                eventId,
                resizeDataRef.current.originalDate,
                format(newEndDate, "yyyy-MM-dd"),
              );
            }
          }
        } catch (error) {
          console.error("Error during resize:", error);
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        resizeDataRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [eventId, date, endDate, onResize],
  );

  return {
    isResizing,
    handleResizeStart,
  };
}
