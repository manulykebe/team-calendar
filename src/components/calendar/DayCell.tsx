import { memo, useState } from "react";
import { format, isFirstDayOfMonth, isSameDay, parseISO } from "date-fns";
import { getWeekNumber } from "../../utils/dateUtils";
import { EventCard } from "./EventCard";
import { MonthLabel } from "./MonthLabel";
import { useFilteredEvents } from "../../hooks/useFilteredEvents";
import { useCalendarColors } from "../../hooks/useCalendarColors";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { Holiday } from "../../lib/api/holidays";
import { Calendar } from "lucide-react";
import { EventDetailsModal } from "./EventDetailsModal";
import { useAuth } from "../../context/AuthContext";

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
	availability?: { am: boolean; pm: boolean };
	isLoadingAvailability: boolean;
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
	availability = { am: true, pm: true },
	isLoadingAvailability,
}: DayCellProps) {
	const { token } = useAuth();
	const [showHolidayModal, setShowHolidayModal] = useState(false);
	const { getColumnColor } = useCalendarColors(currentUser);
	const formattedDate = format(date, "yyyy-MM-dd");
	const dayEvents = useFilteredEvents(events, formattedDate, currentUser);
	const backgroundColor = getColumnColor(date);
	const showMonthLabel = isFirstDayOfMonth(date);
	const isToday = isSameDay(date, new Date());

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
		if (currentUserHolidayEvent) {
			setShowHolidayModal(true);
			return;
		}
		onDateClick(date);
	};

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
				onMouseEnter={() => onDateHover(date)}
				onMouseLeave={() => onDateHover(null)}
				onContextMenu={handleContextMenu}
				data-tsx-id="day-cell"
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