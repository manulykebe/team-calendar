import { useState } from "react";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { useEventPermissions } from "../../hooks/useEventPermissions";
import { SingleDayEventBar } from "./SingleDayEventBar";
import { MultiDayEventBar } from "./MultiDayEventBar";
import { EventDetailsModal } from "./EventDetailsModal";

interface EventCardProps {
  event: Event & { verticalPosition: number };
  date: string;
  userSettings?: User["settings"];
  onDelete?: (eventId: string) => void;
  currentUser?: User | null;
  onResize?: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
}

export function EventCard({
  event,
  date,
  userSettings,
  onDelete,
  currentUser,
  onResize,
}: EventCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { canModify } = useEventPermissions(event, currentUser);
  const isMultiDay = event.endDate && event.endDate !== event.date;

  const handleClick = () => {
    setShowDetails(true);
  };

  if (isMultiDay) {
    return (
      <>
        <MultiDayEventBar
          event={event}
          date={date}
          userSettings={userSettings}
          canModify={canModify}
          onResize={onResize!}
          onClick={handleClick}
        />
        {showDetails && (
          <EventDetailsModal
            event={event}
            onClose={() => setShowDetails(false)}
            onDelete={canModify ? onDelete : undefined}
          />
        )}
      </>
    );
  }

  return (
    <>
      <SingleDayEventBar
        event={event}
        userSettings={userSettings}
        canModify={canModify}
        onDelete={onDelete}
        onResize={onResize!}
        currentUser={currentUser}
        onClick={handleClick}
      />
      {showDetails && (
        <EventDetailsModal
          event={event}
          onClose={() => setShowDetails(false)}
          onDelete={canModify ? onDelete : undefined}
        />
      )}
    </>
  );
}