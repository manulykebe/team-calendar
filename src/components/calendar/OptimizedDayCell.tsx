import { memo, useState, useMemo, useCallback } from "react";
import { format, isFirstDayOfMonth, isSameDay, parseISO } from "date-fns";
import { EventCard } from "./EventCard";
import { MonthLabel } from "./MonthLabel";
import { useCalendarColors } from "../../hooks/useCalendarColors";
import { getEventsForDate } from "../../hooks/useOptimizedEvents";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { Holiday } from "../../lib/api/holidays";
import { Calendar } from "lucide-react";
import { EventDetailsModal } from "./EventDetailsModal";

interface OptimizedDayCellProps {
	date: Date;
	eventsByDate: Map<string, Event[]>;
	colleagueVisibility: Map<string, boolean>;
	colleagueOrder: Map<string, number>;
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
	availability?: { am: boolean; pm: boolean };
	isLoadingAvailability: boolean;
}

const HOLIDAY_TYPES = ["requestedHoliday", "requestedHolidayMandatory"];

export const OptimizedDayCell = memo(function OptimizedDayCell({
	date,
	eventsByDate,
	colleagueVisibility,
	colleagueOrder,
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
	availability = { am: true, pm: true },
	isLoadingAvailability,
}: OptimizedDayCellProps) {
	const [showHolidayModal, setShowHolidayModal] = useState(false);
	const { getColumnColor } = useCalendarColors(currentUser);
	
	// Memoize expensive calculations
	const formattedDate = useMemo(() => format(date, "yyyy-MM-dd"), [date]);
	
	const dayEvents = useMemo(() => 
		getEventsForDate(formattedDate, eventsByDate, colleagueVisibility, colleagueOrder, currentUser),
		[formattedDate, eventsByDate, colleagueVisibility, colleagueOrder, currentUser]
	);
	
	const backgroundColor = useMemo(() => getColumnColor(date), [getColumnColor, date]);
	const showMonthLabel = useMemo(() => isFirstDayOfMonth(date), [date]);
	const isToday = useMemo(() => isSameDay(date, new Date()), [date]);

	// Memoize selection states
	const selectionStates = useMemo(() => {
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

		return { isSelected, isEndDate, isHoverEndDate, isInRange };
	}, [selectedStartDate, selectedEndDate, hoverDate, date]);

	// Memoize current user holiday event check
	const currentUserHolidayEvent = useMemo(() => {
		const events = eventsByDate.get(formattedDate) || [];
		return events.find(
			(event) =>
				HOLIDAY_TYPES.includes(event.type) &&
				event.userId === currentUser?.id &&
				(event.date === formattedDate ||
					(event.endDate &&
						date >= parseISO(event.date) &&
						date <= parseISO(event.endDate)))
		);
	}, [eventsByDate, formattedDate, currentUser?.id, date]);

	// Use useCallback for event handlers to prevent unnecessary re-renders
	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		onDateClick(date);
	}, [onDateClick, date]);

	const handleClick = useCallback(() => {
		if (currentUserHolidayEvent) {
			setShowHolidayModal(true);
			return;
		}
		onDateClick(date);
	}, [currentUserHolidayEvent, onDateClick, date]);

	const handleMouseEnter = useCallback(() => {
		onDateHover(date);
	}, [onDateHover, date]);

	const handleMouseLeave = useCallback(() => {
		onDateHover(null);
	}, [onDateHover]);

	const { isSelected, isEndDate, isHoverEndDate, isInRange } = selectionStates;

	return (
		<>
			<div
				className={`relative p-2 transition-all duration-150 cursor-pointer
          ${isSelected || isEndDate ? "ring-2 ring-blue-500 bg-blue-100" : ""}
          ${isInRange ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-opacity-90"}
          ${isHoverEndDate ? "ring-2 ring-blue-300" : ""}
          ${isSelected || isEndDate ? "z-10" : isInRange ? "z-5" : "z-0"}
          ${currentUserHolidayEvent ? "bg-red-100 bg-stripes-red" : ""}
        `}
				style={{
					backgroundColor: currentUserHolidayEvent
						? undefined
						: isInRange || isSelected || isEndDate
							? undefined
							: backgroundColor,
				}}
				onClick={handleClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onContextMenu={handleContextMenu}
				data-tsx-id="optimized-day-cell"
			>
				{/* Availability background layers */}
				{!isLoadingAvailability ? (
					<>
						{!availability.am && (
							<div className="absolute inset-x-0 top-0 h-1/2 bg-zinc-200 opacity-50" />
						)}
						{!availability.pm && (
							<div className="absolute inset-x-0 bottom-0 h-1/2 bg-zinc-200 opacity-50" />
						)}
					</>
				) : (
					<div className="absolute inset-0 bg-zinc-100 animate-pulse" />
				)}

				{showMonthLabel && <MonthLabel date={date} />}
				<div className="flex items-start justify-between relative">
					<div className="flex items-center space-x-1">
						<span
							className={`relative text-sm font-medium ${
								holiday ? "text-red-600" : "text-zinc-700"
							}`}
						>
							{isToday && (
									<span className="absolute inset-0 w-7 h-7 border-2 border-blue-500 rounded-full -m-[6px]" />
							)}
							<span className="absolute inset-2 flex items-center justify-center">
							{format(date, "d")}
							</span>
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

			{showHolidayModal && currentUserHolidayEvent && (
				<EventDetailsModal
					event={currentUserHolidayEvent}
					onClose={() => setShowHolidayModal(false)}
					onDelete={onEventDelete}
				/>
			)}
		</>
	);
});