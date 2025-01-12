import { useState } from "react";
import { Event } from "../types/event";

export function useDragAndDrop(
  onEventMove: (eventId: string, newDate: string) => Promise<void>,
) {
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const handleDragStart = (event: Event) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (date: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(date);
  };

  const handleDrop = async (date: string) => {
    if (draggedEvent && date !== draggedEvent.date) {
      try {
        await onEventMove(draggedEvent.id, date);
      } catch (error) {
        console.error("Failed to move event:", error);
      }
    }
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  return {
    draggedEvent,
    dragOverDate,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
