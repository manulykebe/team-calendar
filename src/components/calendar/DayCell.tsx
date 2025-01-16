import { memo } from "react";
import {
	format,
	isFirstDayOfMonth,
	isEqual,
	isSameDay,
	parseISO,
} from "date-fns";
import { EventCard } from "./EventCard";
import { MonthLabel } from "./MonthLabel";
import { useFilteredEvents } from "../../hooks/useFilteredEvents";
import { useCalendarColors } from "../../hooks/useCalendarColors";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { Holiday } from "../../lib/api/holidays";
import { Calendar } from "lucide-react";
import { EventDetailsModal } from "./EventDetailsModal";

interface DayCellProps {
	date: Date;
	events: Event[];
	onDateClick: (date: Date) => void;
	onDateHover: (date: Date | null) => void;
	userSettings?: any;
	onEventDelete?: (eventId: string) => void;
	currentUser?: User | null;
	onEventResize?: (
		eventId: string,
		newDate: string,
		newEndDate?: string
	) => Promise<void>;
	holiday?: Holiday;
	selectedStartDate: Date | null;
	selectedEndDate: Date | null;
	hoverDate: Date | null;
}

const HOLIDAY_TYPES = ["requestedHoliday", "requestedHolidayMandatory"];

export const DayCell = memo(function DayCell({
	date,
	events,
	onDateClick,
	onDateHover,
	userSettings,
	onEventDelete,
	currentUser,
	onEventResize,
	holiday,
	selectedStartDate,
	selectedEndDate,
	hoverDate,
}: DayCellProps) {
	const { getColumnColor } = useCalendarColors(currentUser);
	const formattedDate = format(date, "yyyy-MM-dd");
	const dayEvents = useFilteredEvents(events, formattedDate, currentUser);
	const backgroundColor = getColumnColor(date);
	const showMonthLabel = isFirstDayOfMonth(date);

	const isSelected = selectedStartDate && isSameDay(date, selectedStartDate);
	const isEndDate = selectedEndDate && isSameDay(date, selectedEndDate);
	const isHoverEndDate = hoverDate && isSameDay(date, hoverDate);

	const isInRange =
		selectedStartDate &&
		((selectedEndDate &&
			date >= selectedStartDate &&
			date <= selectedEndDate) ||
			(hoverDate && date >= selectedStartDate && date <= hoverDate) ||
			(hoverDate && date <= selectedStartDate && date >= hoverDate));

	// Check if there are any holiday events for the current user on this day
	const currentUserHolidayEvent = events.find(
		(event) =>
			HOLIDAY_TYPES.includes(event.type) &&
			event.userId === currentUser?.id &&
			(event.date === formattedDate ||
				(event.endDate &&
					date >= parseISO(event.date) &&
					date <= parseISO(event.endDate)))
	);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		onDateClick(date);
	};

	const handleClick = () => {
		debugger;
		if (currentUserHolidayEvent) {
			// If there's a holiday event, show the details modal by triggering the event card click
			return;
		}
		onDateClick(date);
	};

	return (
		<div
			className={`relative p-2 transition-all duration-150 cursor-pointer
        ${isSelected || isEndDate ? "ring-2 ring-blue-500 bg-blue-100" : ""}
        ${isInRange ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-opacity-90"}
        ${isHoverEndDate ? "ring-2 ring-blue-300" : ""}
        ${isSelected || isEndDate ? "z-10" : isInRange ? "z-5" : "z-0"}
        ${currentUserHolidayEvent ? "bg-red-100" : ""}
      `}
			style={{
				backgroundColor: currentUserHolidayEvent
					? undefined
					: isInRange || isSelected || isEndDate
						? undefined
						: backgroundColor,
			}}
			onClick={handleClick}
			onMouseEnter={() => onDateHover(date)}
			onMouseLeave={() => onDateHover(null)}
			onContextMenu={handleContextMenu}
			data-tsx-id="day-cell"
		>
			{showMonthLabel && <MonthLabel date={date} />}
			<div className="flex items-start justify-between">
				<div className="flex items-center space-x-1">
					<span
						className={`text-sm font-medium ${
							holiday ? "text-red-600" : "text-zinc-700"
						}`}
					>
						{format(date, "d")}
					</span>
					{holiday && (
						<div
							className="inline-flex items-center text-xs text-red-600 bg-red-50 rounded px-1.5 py-0.5"
							title={holiday.name}
						>
							<Calendar className="w-3 h-3 mr-1" />
							<span className="truncate max-w-[80px]">
								{holiday.name}
							</span>
						</div>
					)}
				</div>
				{dayEvents.length > 0 && (
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
						{dayEvents.length}
					</span>
				)}
			</div>

			<div className="mt-2 relative">
				{dayEvents.map((event) => (
					<EventCard
						key={event.id}
						event={event}
						date={formattedDate}
						userSettings={userSettings}
						onDelete={onEventDelete}
						currentUser={currentUser}
						onResize={onEventResize}
					/>
				))}
			</div>
		</div>
	);
});
