import { useState } from "react";
import { getWeekNumber } from "../../utils/dateUtils";
import { startOfWeek, endOfWeek, format, parseISO, getMonth } from "date-fns";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { useAuth } from "../../context/AuthContext";
import { deleteEvent } from "../../lib/api";
import toast from "react-hot-toast";
import { useTranslation } from "../../context/TranslationContext";
import { Tooltip } from "../common/Tooltip";

interface WeekNumberProps {
	date: Date;
	onWeekClick?: (startDate: Date, endDate: Date) => void;
	events?: Event[];
	currentUser?: User | null;
	onEventDelete?: (eventId: string) => void;
	position: string;
}

export function WeekNumber({
	date,
	onWeekClick,
	events = [],
	currentUser,
	onEventDelete,
	position,
}: WeekNumberProps) {
	const [isHovered, setIsHovered] = useState(false);
	const { token } = useAuth();
	const { t } = useTranslation();
	const weekNumber = getWeekNumber(date);
	const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start from Monday
	const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // End on Sunday

	const monthWeekStart = format(weekStart, "MMMM");
	const monthWeekEnd = format(weekEnd, "MMMM");
	
	// Get translated month name
	const getMonthTranslation = (monthName: string) => {
		const monthMap: Record<string, string> = {
			'January': 'months.january',
			'February': 'months.february',
			'March': 'months.march',
			'April': 'months.april',
			'May': 'months.may',
			'June': 'months.june',
			'July': 'months.july',
			'August': 'months.august',
			'September': 'months.september',
			'October': 'months.october',
			'November': 'months.november',
			'December': 'months.december',
		};
		
		return t(monthMap[monthName] || monthName);
	};
	
	// Check if there's an existing holiday request for this week
	const existingHoliday = events.find((event) => {
		if (event.userId !== currentUser?.id) return false;
		if (
			!["requestedHoliday", "requestedHolidayMandatory"].includes(
				event.type
			)
		)
			return false;

		const eventStart = parseISO(event.date);
		const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;

		return (
			format(eventStart, "yyyy-MM-dd") ===
				format(weekStart, "yyyy-MM-dd") &&
			format(eventEnd, "yyyy-MM-dd") === format(weekEnd, "yyyy-MM-dd")
		);
	});

	const handleClick = async () => {
		if (!token || !currentUser) {
			toast.error(t('auth.loginRequired'));
			return;
		}

		if (existingHoliday && onEventDelete) {
			// Delete existing holiday request
			try {
				await deleteEvent(token, existingHoliday.id);
				onEventDelete(existingHoliday.id);
				toast.success(t('calendar.eventDeleted'));
			} catch (error) {
				toast.error(t('calendar.failedToDeleteEvent'));
			}
		} else if (onWeekClick) {
			// Create new holiday request
			onWeekClick(weekStart, weekEnd);
		}
	};

	const tooltipContent = existingHoliday
		? t('calendar.deleteHoliday', { 
			week: weekNumber, 
			startDate: format(weekStart, "MMM d"), 
			endDate: format(weekEnd, "MMM d") 
		})
		: t('calendar.createHoliday', { 
			week: weekNumber, 
			startDate: format(weekStart, "MMM d"), 
			endDate: format(weekEnd, "MMM d") 
		});

	return (
		<Tooltip content={tooltipContent}>
			<div
				className={`relative flex items-center justify-center text-xs font-medium transition-colors duration-200 cursor-pointer
					${
						isHovered
							? "bg-blue-50 text-blue-600"
							: existingHoliday
								? "bg-red-50 text-red-600"
								: "bg-white text-zinc-500"
					}`}
				onClick={handleClick}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				data-tsx-id="week-number"
			>
				{weekNumber}
				<div
					className={`text-xs absolute -top-0.5 font-medium text-zinc-400 z-30 ${position === "right" ? "-right-0.5" : "-left-0.5"}`}
				>
					{position === "left" ? getMonthTranslation(monthWeekStart) : getMonthTranslation(monthWeekEnd)}
				</div>
			</div>
		</Tooltip>
	);
}