import { memo, useState, useMemo, useCallback } from "react";
import { format, isFirstDayOfMonth, isMonday, isSameDay, parseISO } from "date-fns";
import { EventCard } from "./EventCard";
import { MonthLabel } from "./MonthLabel";
import { useFilteredEvents } from "../../hooks/useFilteredEvents";
import { useCalendarColors } from "../../hooks/useCalendarColors";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { Holiday } from "../../lib/api/holidays";
import { Calendar } from "lucide-react";
import { EventDetailsModal } from "./EventDetailsModal";
import { AdminHolidayModal } from "./AdminHolidayModal";
import { EventContextMenu } from "./EventContextMenu";
import { useApp } from "../../context/AppContext";
import { useHolidays, isPublicHoliday } from "../../context/HolidayContext";
import { OnDutyBadge } from "./OnDutyBadge";
import ReactDOM from "react-dom";
import { isWeekday } from "../../utils/dateUtils";
import { useOnDuty } from "../../hooks/useOnDuty";
import { translateHolidayName } from "../../lib/api/holidays";
import { useTranslation } from "../../context/TranslationContext";

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

export const DayCell = memo(function DayCell({
	date,
	events,
	onDateClick,
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
	const { colleagues, refreshData, availabilityData } = useApp();
	const { holidays: globalHolidays } = useHolidays();
	const { language } = useTranslation();
	const [showHolidayModal, setShowHolidayModal] = useState(false);
	const [showAdminModal, setShowAdminModal] = useState(false);
	const [selectedHolidayEvent, setSelectedHolidayEvent] = useState<Event | null>(null);
	const [contextMenu, setContextMenu] = useState<{
		event: Event;
		position: { x: number; y: number };
	} | null>(null);
	const { getColumnColor } = useCalendarColors(currentUser);
	const { onDutyUserId, isUserOnDuty } = useOnDuty(format(date, "yyyy-MM-dd"), currentUser?.id);

	// Check if this date is a public holiday using the global context
	const isHoliday = useMemo(() => {
		return isPublicHoliday(date, globalHolidays) || !!holiday;
	}, [date, globalHolidays, holiday]);

	// Memoize expensive calculations
	const formattedDate = useMemo(() => format(date, "yyyy-MM-dd"), [date]);
	const dayEvents = useFilteredEvents(events, formattedDate, currentUser);
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
		return events.find(
			(event) =>
				["requestedLeave", "requestedLeaveMandatory"].includes(event.type) &&
				event.userId === currentUser?.id &&
				(event.date === formattedDate ||
					(event.endDate &&
						date >= parseISO(event.date) &&
						date <= parseISO(event.endDate)))
		);
	}, [events, currentUser?.id, formattedDate, date]);

	// Use useCallback for event handlers to prevent unnecessary re-renders
	const handleContextMenu = useCallback((e: React.MouseEvent, event: Event) => {
		e.preventDefault();
		e.stopPropagation();

		// Only admin can access context menu
		if (currentUser?.role !== 'admin') return;

		setContextMenu({
			event,
			position: { x: e.clientX, y: e.clientY }
		});
	}, [currentUser?.role]);

	const handleClick = useCallback(() => {
		if (currentUserHolidayEvent) {
			const isAdmin = currentUser?.role === "admin";

			if (isAdmin) {
				// Admin can manage any holiday request
				setSelectedHolidayEvent(currentUserHolidayEvent);
				setShowAdminModal(true);
			} else {
				// Regular user can only view their own
				setSelectedHolidayEvent(currentUserHolidayEvent);
				setShowHolidayModal(true);
			}
			return;
		}
		onDateClick(date);
	}, [currentUserHolidayEvent, onDateClick, date, currentUser?.role]);

	// Find the event owner for admin modal
	const getEventOwner = (event: Event) => {
		return event.userId === currentUser?.id
			? currentUser
			: colleagues.find(c => c.id === event.userId) || null;
	};

	const { isSelected, isEndDate, isHoverEndDate, isInRange } = selectionStates;

	// Get on-duty user details for admin view
	const getOnDutyUserDetails = () => {
		if (!onDutyUserId || currentUser?.role !== 'admin') return null;
		
		const onDutyUser = colleagues.find(c => c.id === onDutyUserId) || 
						  (currentUser.id === onDutyUserId ? currentUser : null);
		
		if (!onDutyUser) return null;
		
		// Get initials from settings or generate from name
		const colleagueSettings = currentUser?.settings?.colleagues?.[onDutyUserId];
		const initials = colleagueSettings?.initials || 
					   `${onDutyUser.firstName[0]}${onDutyUser.lastName[0]}`;
		
		return {
			initials,
			color: colleagueSettings?.color || "#4575b4"
		};
	};

	const onDutyUserDetails = getOnDutyUserDetails();

	return (
		<>
			<div
				className={`relative p-2 transition-all duration-150 cursor-pointer
          ${isSelected || isEndDate ? "ring-2 ring-blue-500 bg-blue-100" : ""}
          ${isInRange ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-opacity-90"}
          ${isHoverEndDate ? "ring-2 ring-blue-300" : ""}
          ${isSelected || isEndDate ? "z-10" : isInRange ? "z-5" : "z-0"}
		  ${isPublicHoliday(date, globalHolidays) ? "bg-red-50" : isWeekday(date) ? "bg-white" : "bg-zinc-50"}
        `}

				onClick={handleClick}
				data-tsx-id="day-cell"
			>
				{/* Availability background layers */}
				{(!isLoadingAvailability && isWeekday(date)) ? (
					<>
						{!availability.am && (
							<div className={`absolute inset-x-0 top-0 h-1/2 opacity-50
								${isPublicHoliday(date, globalHolidays) ? "bg-red-100" : "bg-zinc-100"}`} />
						)}
						{!availability.pm && (
							<div className={`absolute inset-x-0 bottom-0 h-1/2 opacity-50
								${isPublicHoliday(date, globalHolidays) ? "bg-red-100" : "bg-zinc-100"}`} />
						)}
					</>
				) : (
					<div className={`absolute inset-0 animate-pulse`} />
				)}

				{/* Only show month label if it's the first day of the month and not in the first column */}
				{showMonthLabel && !isMonday(date) && <MonthLabel date={date} />}
				
				<div className="flex items-start justify-between relative">
					<div className="flex items-center space-x-0 space-y-0">
						<span
							className={`relative text-sm font-medium ${isHoliday ? "text-red-600" : "text-zinc-700"
								}`}
						>
							{isToday && (
								<span className="absolute inset-0 w-7 h-7 border-2 border-blue-500 rounded-full -ml-[10px] -mt-[4px] bg-blue-100" />
							)}
							<span className="absolute top-0 -left-1 flex items-center justify-center">
								{format(date, "d")}
							</span>
						</span>
						{holiday && (
							<div
								className="absolute text-xs inline-flex items-center text-red-600 -left-2"
								title={translateHolidayName(holiday.name, language)}
							>
								<Calendar className="w-3 h-3 mr-0" />
								<span className="truncate max-w-[80px]">
									{translateHolidayName(holiday.name, language)}
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

				{/* On-duty badge */}
				{isUserOnDuty && currentUser?.role !== 'admin' && (
					<OnDutyBadge className="absolute top-1 right-1" />
				)}

				{/* Admin view: show on-duty user initials */}
				{onDutyUserDetails && currentUser?.role === 'admin' && (
					<div 
						className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
						style={{ backgroundColor: onDutyUserDetails.color }}
						title={`On Duty: ${colleagues.find(c => c.id === onDutyUserId)?.firstName || ''} ${colleagues.find(c => c.id === onDutyUserId)?.lastName || ''}`}
					>
						{onDutyUserDetails.initials}
					</div>
				)}

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
							onContextMenu={(e) => handleContextMenu(e, event)}
							availabilityData={availabilityData}
						/>
					))}
				</div>
			</div>

			{showHolidayModal && selectedHolidayEvent &&
				ReactDOM.createPortal(
					<EventDetailsModal
						event={selectedHolidayEvent}
						onClose={() => {
							setShowHolidayModal(false);
							setSelectedHolidayEvent(null);
						}}
						onDelete={onEventDelete}
					/>,
					document.body
				)
			}

			{showAdminModal && selectedHolidayEvent && (
				<AdminHolidayModal
					event={selectedHolidayEvent}
					eventOwner={getEventOwner(selectedHolidayEvent)}
					onClose={() => {
						setShowAdminModal(false);
						setSelectedHolidayEvent(null);
					}}
					onUpdate={refreshData}
				/>
			)}

			{contextMenu && (
				<EventContextMenu
					event={contextMenu.event}
					eventOwner={getEventOwner(contextMenu.event)}
					position={contextMenu.position}
					onClose={() => setContextMenu(null)}
					onUpdate={refreshData}
				/>
			)}
		</>
	);
});