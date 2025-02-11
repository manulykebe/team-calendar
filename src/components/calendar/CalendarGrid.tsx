import { useState, useEffect } from "react";
import { DayCell } from "./DayCell";
import { CalendarHeader } from "./CalendarHeader";
import { WeekColumn } from "./WeekColumn";
import { getCalendarDays } from "../../utils/calendar";
import { Event } from "../../types/event";
import { User } from "../../types/user";
import { Holiday, getHolidays } from "../../lib/api/holidays";
import { format } from "date-fns";
import { getSiteData } from "../../lib/api/client";

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

	const { days, emptyDays, weekDays } = getCalendarDays(
		currentMonth,
		weekStartsOn as any
	);

	useEffect(() => {
		const fetchHolidays = async () => {
			// Skip fetch if no user or site data
			if (!currentUser?.site) {
				setHolidays([]); // Reset holidays when no site data
				return;
			}

			setLoading(true);
			const year = format(currentMonth, "yyyy");
			try {
				const siteData = await getSiteData(currentUser.site);
				if (!siteData?.app?.location) {
					setHolidays([]);
					return;
				}

				const location = siteData.app.location;
				const holidayData = await getHolidays(year, location);
				setHolidays(holidayData);
			} catch (err) {
				console.error("Failed to fetch holidays:", err);
				setHolidays([]);
			} finally {
				setLoading(false);
			}
		};

		fetchHolidays();
	}, [currentMonth, currentUser?.site]);

	const showWeekNumber = currentUser?.settings?.showWeekNumber || "none";

	const visibleColleagues = currentUser?.settings?.colleagues
		? Object.values(currentUser.settings.colleagues).filter(
				(c: any) => c.visible !== false
			).length
		: 1;

	const rowHeight = Math.max(120, 42 + (visibleColleagues - 1) * 24);

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
					{days.map((day) => {
						const formattedDate = format(day, "yyyy-MM-dd");
						const holiday = holidays.find(
							(h) => h.date === formattedDate
						);

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
					})}
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
