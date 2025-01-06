import { Event } from "../../types/event";
import { User } from "../../types/user";
import { format, parseISO, differenceInDays } from "date-fns";
import { Calendar } from "lucide-react";
import { EventResizeHandle } from "./EventResizeHandle";
import { useEventResize } from "../../hooks/useEventResize";

interface MultiDayEventBarProps {
  event: Event & { verticalPosition: number };
  date: string;
  userSettings?: User["settings"];
  canModify: boolean;
  onResize: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
}

export function MultiDayEventBar({
  event,
  date,
  userSettings,
  canModify,
  onResize,
}: MultiDayEventBarProps) {
  const { isResizing, handleResizeStart } = useEventResize({
    eventId: event.id,
    date: event.date,
    endDate: event.endDate,
    onResize
  });

  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || "#e2e8f0";
  const prefix = colleagueSettings?.initials ? `[${colleagueSettings.initials}] ` : "";
  
  const isFirstDay = date === event.date;
  const isLastDay = date === event.endDate;
  const duration = differenceInDays(parseISO(event.endDate!), parseISO(event.date)) + 1;

  // Calculate top position based on verticalPosition
  const topPosition = event.verticalPosition * 24; // Reduced from 28px

  return (
    <div
      className={`absolute left-0 right-0 flex items-center justify-between text-xs
        ${isFirstDay ? 'rounded-l pl-2' : ''}
        ${isLastDay ? 'rounded-r pr-2' : ''}
        ${!isFirstDay && !isLastDay ? 'px-0' : ''}
        ${canModify && !isResizing ? 'cursor-move' : 'cursor-default'}
      `}
      style={{
        backgroundColor,
        color: backgroundColor === "#fee090" || backgroundColor === "#e0f3f8" ? "#1a202c" : "white",
        marginLeft: isFirstDay ? '0' : '-8px',
        marginRight: isLastDay ? '0' : '-8px',
        top: `${topPosition}px`,
        height: '20px', // Reduced from 24px
        zIndex: isResizing ? 20 : 10,
        borderLeft: !isFirstDay ? '1px solid rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {canModify && (
        <>
          {isFirstDay && (
            <EventResizeHandle
              position="left"
              onMouseDown={(e) => handleResizeStart('start', e)}
            />
          )}
          {isLastDay && (
            <EventResizeHandle
              position="right"
              onMouseDown={(e) => handleResizeStart('end', e)}
            />
          )}
        </>
      )}
      
      <div className="flex-1 min-w-0">
        {isFirstDay && (
          <span className="truncate">
            {prefix}{event.title}
          </span>
        )}
      </div>
      {isLastDay && (
        <div className="flex items-center shrink-0" title={`${duration} day event`}>
          <Calendar className="w-3 h-3 mr-1" />
          {duration}d
        </div>
      )}
    </div>
  );
}