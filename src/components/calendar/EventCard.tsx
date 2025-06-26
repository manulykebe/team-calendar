import { useState } from "react";
import { parseISO, eachDayOfInterval, format, isWeekend } from "date-fns";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { AdminHolidayModal } from "./AdminHolidayModal";
import { EventDetailsModal } from "./EventDetailsModal";
import { useApp } from "../../context/AppContext";
import { useTranslation } from "../../context/TranslationContext";
import ReactDOM from "react-dom";
import { UserSettings } from "../../../src/lib/api/types";

interface Holiday {
	date: string;
	name: string;
	type: string;
}

interface EventCardProps {
	event: Event & { verticalPosition: number };
	date: string;
	userSettings?: UserSettings;
	onDelete?: (eventId: string) => void;
	currentUser?: User | null;
	onResize?: (
		eventId: string,
		newDate: string,
		newEndDate?: string
	) => Promise<void>;
	onContextMenu?: (e: React.MouseEvent) => void;
	holidays?: Map<string, Holiday>;
	availabilityData?: Record<string, { am: boolean; pm: boolean }>;
}

const HOLIDAY_TYPES = ["requestedHoliday", "requestedDesiderata", "requestedPeriod"];

export function EventCard({
	event,
	date,
	userSettings,
	onDelete,
	currentUser,
	onContextMenu,
	holidays,
	availabilityData,
}: EventCardProps) {
	const [showDetails, setShowDetails] = useState(false);
	const [showAdminModal, setShowAdminModal] = useState(false);
	const { colleagues, refreshData } = useApp();
	const { t } = useTranslation();
	
	const isHolidayEvent = HOLIDAY_TYPES.includes(event.type);
	const isCurrentUserEvent = event.userId === currentUser?.id;
	const isAdmin = currentUser?.role === "admin";

	// Find the event owner from colleagues or current user
	const eventOwner = event.userId === currentUser?.id 
		? currentUser 
		: colleagues.find(c => c.id === event.userId) || null;

	const handleClick = (e: React.MouseEvent) => {
		// If right-click and admin, let the context menu handle it
		if (e.button === 2 && isAdmin) {
			return;
		}
		
		// Admin can manage any holiday request
		if (isAdmin && isHolidayEvent) {
			setShowAdminModal(true);
		} else if (isHolidayEvent && isCurrentUserEvent) {
			setShowDetails(true);
		}
		// For non-holiday events, no click action (they're just displayed)
	};

	// Get colleague settings for styling - use event owner's settings for proper display
	const colleagueSettings = userSettings?.colleagues?.[event.userId];
	const backgroundColor = colleagueSettings?.color || "#e2e8f0";
	
	// For admin view, show colleague initials for all events
	const getEventPrefix = () => {
		if (isAdmin && !isCurrentUserEvent && colleagueSettings?.initials) {
			return `[${colleagueSettings.initials}] `;
		}
		if (isCurrentUserEvent) {
			return ""; // No prefix for current user's events
		}
		if (colleagueSettings?.initials) {
			return `[${colleagueSettings.initials}] `;
		}
		return "";
	};

	const prefix = getEventPrefix();
	const isMultiDay = event.endDate && event.endDate !== event.date;
	const topPosition = event.verticalPosition * 24;

	// Calculate precise duration excluding weekends, holidays, and unavailable days
	const calculatePreciseDuration = () => {
		if (!event.endDate || event.date === event.endDate) {
			return 1; // Single day event
		}

		const startDate = parseISO(event.date);
		const endDate = parseISO(event.endDate);
		
		// Get all days in the range
		const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
		
		// Calculate working days (exclude weekends and holidays)
		let workingDays = 0;
		
		for (const day of daysInRange) {
			const dateStr = format(day, "yyyy-MM-dd");
			
			// Skip weekends
			if (isWeekend(day)) {
				continue;
			}
			
			// Skip holidays if available
			if (holidays?.has(dateStr)) {
				continue;
			}
			
			// Check availability for the day
			const availability = availabilityData?.[dateStr];
			
			if (availability) {
				// Add 0.5 for each half-day available
				if (availability.am) workingDays += 0.5;
				if (availability.pm) workingDays += 0.5;
			} else {
				// If no availability data, count as a full day
				workingDays += 1;
			}
		}
		
		// Round to nearest 0.5 for display
		return Math.max(0.5, Math.round(workingDays * 2) / 2);
	};

	// Get event type styling based on status
	const getEventTypeStyle = () => {
		// For approved events, use green
		if (event.status === 'approved') {
			return {
				backgroundColor: "#10b981", // Green for approved
				borderColor: "#059669",
			};
		}
		
		// For denied events, use red
		if (event.status === 'denied') {
			return {
				backgroundColor: "#ef4444", // Red for denied
				borderColor: "#dc2626",
			};
		}

		// Default styling for pending/other statuses
		if (event.type === "requestedDesiderata") {
			return {
				backgroundColor: "#10b981", // Green for desiderata
				borderColor: "#059669",
			};
		}
		if (event.type === "requestedHoliday") {
			return {
				backgroundColor: "#f59e0b", // Amber for holiday
				borderColor: "#d97706",
			};
		}
		if (event.type === "requestedPeriod") {
			return {
				backgroundColor: "#8b5cf6", // Purple for period
				borderColor: "#7c3aed",
			};
		}
		return { 
			backgroundColor,
			borderColor: backgroundColor
		};
	};

	const eventStyle = getEventTypeStyle();

	// Get display text for event
	const getEventDisplayText = () => {
		if (event.title) {
			return `${prefix}${event.title}`;
		}
		
		// Show status in the display text for admin view of holiday events
		if (isAdmin && isHolidayEvent && !isCurrentUserEvent) {
			const statusText = event.status === 'approved' ? t('events.approved') : 
							  event.status === 'denied' ? t('events.denied') : t('events.pending');
			
			let typeText = '';
			if (event.type === "requestedDesiderata") {
				typeText = t('calendar.requestedDesiderata');
			} else if (event.type === "requestedPeriod") {
				typeText = t('calendar.requestedPeriod');
			} else {
				typeText = t('calendar.holiday');
			}
			
			return `${prefix}${statusText} ${typeText}`;
		}
		
		// Default text based on event type
		switch (event.type) {
			case "requestedHoliday":
			switch (event.status) {
				case "approved":
					return `${prefix}${t('calendar.approvedHoliday')}`;
				case "denied":
					return `${prefix}${t('calendar.deniedHoliday')}`;
				case "pending":
					return `${prefix}${t('calendar.pendingHoliday')}`;
				default:
					return `${prefix}${t('calendar.requestedHoliday')}`;
			}
			case "requestedDesiderata":
				return `${prefix}${t('calendar.requestedDesiderata')}`;
			case "requestedPeriod":
				return `${prefix}${t('calendar.requestedPeriod')}`;
			default:
				return `${prefix}${event.type}`;
		}
	};

	// Calculate border styles for multi-day events
	const getBorderStyles = () => {
		if (!isMultiDay) {
			// Single day event - full border
			return {
				border: `2px solid ${eventStyle.borderColor}`,
				borderRadius: "6px",
			};
		}

		// Multi-day event logic
		const isFirstDay = event.date === date;
		const isLastDay = event.endDate === date;
		
		const borderWidth = "2px";
		const borderStyle = "solid";
		const borderColor = eventStyle.borderColor;
		
		let borderStyles: React.CSSProperties = {
			borderTopWidth: borderWidth,
			borderBottomWidth: borderWidth,
			borderTopStyle: borderStyle,
			borderBottomStyle: borderStyle,
			borderTopColor: borderColor,
			borderBottomColor: borderColor,
		};

		// Add left border only on first day
		if (isFirstDay) {
			borderStyles = {
				...borderStyles,
				borderLeftWidth: borderWidth,
				borderLeftStyle: borderStyle,
				borderLeftColor: borderColor,
				borderTopLeftRadius: "6px",
				borderBottomLeftRadius: "6px",
			};
		}

		// Add right border only on last day
		if (isLastDay) {
			borderStyles = {
				...borderStyles,
				borderRightWidth: borderWidth,
				borderRightStyle: borderStyle,
				borderRightColor: borderColor,
				borderTopRightRadius: "6px",
				borderBottomRightRadius: "6px",
			};
		}

		return borderStyles;
	};

	// Determine cursor style
	const getCursorStyle = () => {
		if (isAdmin && isHolidayEvent) return "cursor-pointer";
		if (isHolidayEvent && isCurrentUserEvent) return "cursor-pointer";
		return "cursor-default";
	};

	// Get tooltip text
	const getTooltipText = () => {
		if (isAdmin && isHolidayEvent && !isCurrentUserEvent) {
			return t('adminHoliday.clickToManage', { name: eventOwner?.firstName || t('common.colleague') });
		}
		if (isHolidayEvent && isCurrentUserEvent) {
			return t('adminHoliday.clickToViewDetails');
		}
		return undefined;
	};

	return (
		<div data-tsx-id="event-card">
			<div
				onClick={(e) => {
					// stop propagation only if user is admin or it's a holiday event
					if (isAdmin || isHolidayEvent) {
						e.stopPropagation();
					}
					handleClick(e as React.MouseEvent);
				}}
				onContextMenu={(e) => {
					if (onContextMenu && isAdmin) {
						onContextMenu(e);
					}
				}}
				className={`absolute left-0 right-0 flex items-center justify-between text-xs hover:opacity-90 transition-all duration-200 ${getCursorStyle()}`}
				style={{
					backgroundColor: eventStyle.backgroundColor,
					color: "white",
					top: `${topPosition}px`,
					height: "20px",
					zIndex: 10,
					paddingLeft: isMultiDay && event.date === date ? "8px" : "8px",
					paddingRight: isMultiDay && event.endDate === date ? "8px" : "8px",
					marginLeft: isMultiDay && event.date !== date ? "-8px" : "0",
					marginRight: isMultiDay && event.endDate !== date ? "-8px" : "0",
					...getBorderStyles(),
				}}
				title={getTooltipText()}
			>
				<span className="truncate font-medium flex-1">
					{getEventDisplayText()}
				</span>

				{isMultiDay && event.endDate === date && (
					<div className="flex items-center shrink-0 ml-2">
						<span className="text-xs">
							{calculatePreciseDuration()}d
						</span>
					</div>
				)}
			</div>

			{showDetails &&
				ReactDOM.createPortal(
					<EventDetailsModal
						event={event}
						onClose={() => setShowDetails(false)}
						onDelete={onDelete}
					/>,
					document.body
				)
			}

			{showAdminModal && (
				<AdminHolidayModal
					event={event}
					eventOwner={eventOwner}
					onClose={() => setShowAdminModal(false)}
					onUpdate={refreshData}
				/>
			)}
		</div>
	);
}