import { Event } from "../../types/event";
import { User } from "../../types/user";
import { format, parseISO, differenceInDays } from "date-fns";
import { Calendar, GripVertical } from "lucide-react";

interface MultiDayEventBarProps {
  event: Event;
  date: string;
  userSettings?: User["settings"];
  canModify: boolean;
  isResizing: boolean;
  onResizeStart: (edge: 'start' | 'end', e: React.MouseEvent) => void;
  onResize?: (eventId: string, newDate: string, newEndDate?: string) => Promise<void>;
}

export function MultiDayEventBar({
  event,
  date,
  userSettings,
  canModify,
  isResizing,
  onResizeStart,
  onResize
}: MultiDayEventBarProps) {
  const colleagueSettings = userSettings?.colleagues?.[event.userId];
  const backgroundColor = colleagueSettings?.color || "#e2e8f0";
  const prefix = colleagueSettings?.initials ? `[${colleagueSettings.initials}] ` : "";
  
  const isFirstDay = date === event.date;
  const isLastDay = date === event.endDate;
  const duration = differenceInDays(parseISO(event.endDate!), parseISO(event.date)) + 1;

  return (
    <div
      className={`relative flex items-center justify-between h-6 text-xs group
        ${isFirstDay ? 'rounded-l pl-2' : ''}
        ${isLastDay ? 'rounded-r pr-2' : ''}
        ${!isFirstDay && !isLastDay ? 'px-0' : ''}
        ${canModify && !isResizing ? 'cursor-move' : 'cursor-default'}
      `}
      style={{
        backgroundColor,
        color: backgroundColor === "#fee090" || backgroundColor === "#e0f3f8" ? "#1a202c" : "white",
        marginLeft: isFirstDay ? '0' : '-10px',
        marginRight: isLastDay ? '0' : '-10px',
        position: 'relative',
        zIndex: isResizing ? 20 : 10,
        borderLeft: !isFirstDay ? '1px solid rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {canModify && onResize && (
        <>
          {isFirstDay && (
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => onResizeStart('start', e)}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-4 h-4 rounded bg-white/90 shadow-sm border border-zinc-200">
                <GripVertical className="w-3 h-3 text-zinc-400" />
              </div>
            </div>
          )}
          {isLastDay && (
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => onResizeStart('end', e)}
            >
              <div className="absolute top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center w-4 h-4 rounded bg-white/90 shadow-sm border border-zinc-200">
                <GripVertical className="w-3 h-3 text-zinc-400" />
              </div>
            </div>
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