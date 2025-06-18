import { useState, useEffect, useMemo } from "react";
import { DayCell } from "./DayCell";
import { CalendarHeader } from "./CalendarHeader";
import { WeekColumn } from "./WeekColumn";
import { getCalendarDays } from "../../utils/calendar";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { Holiday, getHolidays } from "../../lib/api/holidays";
import { format } from "date-fns";
import { getSiteData } from "../../lib/api/client";
import { useWebSocketContext } from "../../context/WebSocketContext";
import { useTranslation } from "../../context/TranslationContext";

interface CalendarGridProps {
	currentMonth: Date;
	events: Event[];
	onDateClick: (date: Date) => void;
	onDateHover: (date: Date | null) => void;
	weekStartsOn: string;
	userSettings?: any;
	onEventDelete?: (eventId: string) => void;
	currentUser?: User | null;
	onEventResize?: (
		eventId: string,
		newDate: string,
		newEndDate?: string
	) => Promise<void>;
	selectedStartDate: Date | null;
	selectedEndDate: Date | null;
	hoverDate: Date | null;
	onWeekSelect?: (startDate: Date, endDate: Date) => void;
	availabilityData: Record<string, { am: boolean; pm: boolean }>;
	isLoadingAvailability: boolean;
}

export function CalendarGrid({
	currentMonth,
	events,
	onDateClick,
	onDateHover,
	weekStartsOn,
	userSettings,
	onEventDelete,
	currentUser,
	onEventResize,
	selectedStartDate,
	selectedEndDate,
	hoverDate,
	onWeekSelect,
	availabilityData,
	isLoadingAvailability,
}: CalendarGridProps) {
	const [loading, setLoading] = useState(false);
	const [holidays, setHolidays] = useState<Holiday[]>([]);
	const { joinCalendarDate, leaveCalendarDate } = useWebSocketContext();
	const { language } = useTranslation();

	// Memoize calendar calculations
	const { days, emptyDays, weekDays } = useMemo(() => 
		getCalendarDays(currentMonth, weekStartsOn as any),
		[currentMonth, weekStartsOn]
	);

	// Memoize holidays map for faster lookups
	const holidaysMap = useMemo(() => {
		const map = new Map<string, Holiday>();
		holidays.forEach(holiday => {
			map.set(holiday.date, holiday);
		});
		return map;
	}, [holidays]);

	// Join/leave WebSocket rooms for visible dates
	useEffect(() => {
		const visibleDates = days.map(day => format(day, 'yyyy-MM-dd'));
		
		// Join rooms for all visible dates
		visibleDates.forEach(date => {
			joinCalendarDate(date);
		});

		// Cleanup: leave rooms when component unmounts or dates change
		return () => {
			visibleDates.forEach(date => {
				leaveCalendarDate(date);
			});
		};
	}, [days, joinCalendarDate, leaveCalendarDate]);

	// Optimize holiday fetching with better caching
	useEffect(() => {
		let isCancelled = false;

		const fetchHolidays = async () => {
			if (!currentUser?.site) {
				setHolidays([]);
				return;
			}

			const year = format(currentMonth, "yyyy");
			const cacheKey = `holidays-${currentUser.site}-${year}`;
			
			// Check if we already have this data cached
			const cached = sessionStorage.getItem(cacheKey);
			if (cached) {
				try {
					const cachedData = JSON.parse(cached);
					if (!isCancelled) {
						setHolidays(cachedData);
					}
					return;
				} catch (e) {
					// Invalid cache, continue with fetch
				}
			}

			setLoading(true);
			try {
				const siteData = await getSiteData(currentUser.site);
				if (!siteData?.app?.location) {
					setHolidays([]);
					return;
				}

				const location = siteData.app.location;
				const holidayData = await getHolidays(year, location);
				
				if (!isCancelled) {
					setHolidays(holidayData);
					// Cache the result
					sessionStorage.setItem(cacheKey, JSON.stringify(holidayData));
				}
			} catch (err) {
				console.error("Failed to fetch holidays:", err);
				if (!isCancelled) {
					setHolidays([]);
				}
			} finally {
				if (!isCancelled) {
					setLoading(false);
				}
			}
		};

		fetchHolidays();

		return () => {
			isCancelled = true;
		};
	}, [currentMonth, currentUser?.site]);

	const showWeekNumber = currentUser?.settings?.showWeekNumber || "none";

	// Calculate row height based on visible colleagues
	const visibleColleagues = useMemo(() => {
		// For admin view, we need to count all visible colleagues
		if (currentUser?.role === 'admin') {
			if (!currentUser?.settings?.colleagues) return 1;
			
			// Count visible colleagues
			const visibleCount = Object.values(currentUser.settings.colleagues).filter(
				(c: any) => c.visible !== false
			).length;
			
			// Add 1 for the current user
			return visibleCount + 1;
		}
		
		// For regular users
		if (!currentUser?.settings?.colleagues) return 1;
		return Object.values(currentUser.settings.colleagues).filter(
			(c: any) => c.visible !== false
		).length;
	}, [currentUser?.settings?.colleagues, currentUser?.role]);

	// Adjust row height based on number of visible colleagues
	const rowHeight = Math.max(120, 42 + (visibleColleagues - 1) * 24);

	// Memoize day cells to prevent unnecessary re-renders
	const dayCells = useMemo(() => {
		return days.map((day) => {
			const formattedDate = format(day, "yyyy-MM-dd");
			const holiday = holidaysMap.get(formattedDate);

			return (
				<DayCell
					key={day.toISOString()}
					date={day}
					events={events}
					onDateClick={onDateClick}
					onDateHover={onDateHover}
					userSettings={userSettings}
					onEventDelete={onEventDelete}
					currentUser={currentUser}
					onEventResize={onEventResize}
					holiday={holiday}
					selectedStartDate={selectedStartDate}
					selectedEndDate={selectedEndDate}
					hoverDate={hoverDate}
					availability={availabilityData[formattedDate]}
					isLoadingAvailability={isLoadingAvailability}
				/>
			);
		});
	}, [
		days,
		holidaysMap,
		events,
		onDateClick,
		onDateHover,
		userSettings,
		onEventDelete,
		currentUser,
		onEventResize,
		selectedStartDate,
		selectedEndDate,
		hoverDate,
		availabilityData,
		isLoadingAvailability
	]);

	return (
		<div className="bg-zinc-200" data-tsx-id="calendar-grid">
			<CalendarHeader
				weekDays={weekDays}
				showWeekNumber={showWeekNumber}
			/>
			<div
				className={`grid ${
					showWeekNumber === "left"
						? "grid-cols-[3rem_1fr]"
						: showWeekNumber === "right"
							? "grid-cols-[1fr_3rem]"
							: "grid-cols-1"
				} gap-px bg-zinc-200`}
			>
				{showWeekNumber === "left" && (
					<WeekColumn
						days={days}
						position="left"
						rowHeight={rowHeight}
						onWeekClick={onWeekSelect}
						events={events}
						currentUser={currentUser}
						onEventDelete={onEventDelete}
					/>
				)}
				<div
					className="grid grid-cols-7 gap-px bg-zinc-200"
					style={{
						gridAutoRows: `${rowHeight}px`,
					}}
				>
					{Array.from({ length: emptyDays }).map((_, index) => (
						<div key={`empty-${index}`} className="bg-white p-2" />
					))}
					{dayCells}
				</div>
				{showWeekNumber === "right" && (
					<WeekColumn
						days={days}
						position="right"
						rowHeight={rowHeight}
						onWeekClick={onWeekSelect}
						events={events}
						currentUser={currentUser}
						onEventDelete={onEventDelete}
					/>
				)}
			</div>
		</div>
	);
}