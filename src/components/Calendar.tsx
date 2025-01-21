import { useState, useEffect } from "react";
import {
	ChevronLeft,
	ChevronsLeft,
	ChevronsRight,
	ChevronRight,
	CalendarIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../lib/api";
import { EventModal } from "./EventModal";
import { SettingsPanel } from "./settings/SettingsPanel";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { MonthPicker } from "./calendar/MonthPicker";
import { User } from "../types/user";
import { userSettingsEmitter } from "../hooks/useColleagueSettings";
import { useCalendarSettings } from "../hooks/useCalendarSettings";
import { useCalendarState } from "../hooks/useCalendarState";
import { 
	subDays, 
	addWeeks, 
	subWeeks, 
	addMonths, 
	subMonths, 
	format, 
	startOfWeek,
	startOfMonth,
	endOfMonth,
	startOfDay,
	isSameWeek
} from "date-fns";
import { getAvailabilityReport } from "../lib/api/report";
import toast from "react-hot-toast";

export function Calendar() {
	const { token } = useAuth();
	const { weekStartsOn } = useCalendarSettings();
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [availabilityData, setAvailabilityData] = useState<Record<string, { am: boolean; pm: boolean }>>({});
	const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

	const {
		events,
		selectedStartDate,
		selectedEndDate,
		hoverDate,
		currentMonth,
		showModal,
		selectedEvent,
		setCurrentMonth,
		setShowModal,
		setSelectedEvent,
		handleDateClick,
		handleDateHover,
		resetSelection,
		fetchEvents,
		handleCreateEvent,
		handleEventDelete,
		handleEventResize,
		setSelectedStartDate,
		setSelectedEndDate,
	} = useCalendarState(token);

	useEffect(() => {
		if (token) {
			Promise.all([fetchEvents(), getUsers(token)])
				.then(([_, users]) => {
					const userEmail = localStorage.getItem("userEmail");
					const user = users.find((u: User) => u.email === userEmail);
					if (user) {
						setCurrentUser(user);
					}
				})
				.catch(console.error);

			const handleSettingsUpdate = ({
				userId,
				settings,
			}: {
				userId: string;
				settings: any;
			}) => {
				setCurrentUser((prev) =>
					prev && prev.id === userId ? { ...prev, settings } : prev
				);
			};

			const handleAvailabilityChange = () => {
				fetchEvents();
			};

			userSettingsEmitter.on("settingsUpdated", handleSettingsUpdate);
			userSettingsEmitter.on("availabilityChanged", handleAvailabilityChange);
			
			return () => {
				userSettingsEmitter.off("settingsUpdated", handleSettingsUpdate);
				userSettingsEmitter.off("availabilityChanged", handleAvailabilityChange);
			};
		}
	}, [token, fetchEvents]);

	useEffect(() => {
		const fetchAvailabilityData = async () => {
			if (!token || !currentUser) return;

			setIsLoadingAvailability(true);
			try {
				const startDisplayDate = subWeeks(startOfWeek(currentMonth, { weekStartsOn: 1 }), 1);
				const endDisplayDate = subDays(addWeeks(startOfWeek(currentMonth, { weekStartsOn: 1 }), 3 + 1), 1);

				const year = format(currentMonth, "yyyy");
				const report = await getAvailabilityReport(
					token,
					currentUser.site,
					currentUser.id,
					year,
					format(startDisplayDate, "yyyy-MM-dd"),
					format(endDisplayDate, "yyyy-MM-dd")
				);

				setAvailabilityData(report.availability);
			} catch (error) {
				console.error("Failed to fetch availability data:", error);
				toast.error("Failed to load availability data");
			} finally {
				setIsLoadingAvailability(false);
			}
		};

		fetchAvailabilityData();
	}, [token, currentUser, currentMonth]);

	const handleToday = () => {
		const today = startOfDay(new Date());
		const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
		
		// If today is already in the current visible range, no need to change
		if (!isSameWeek(currentMonth, today, { weekStartsOn: 1 })) {
			setCurrentMonth(weekStart);
		}
	};

	const handlePrevMonth = () => {
		setCurrentMonth((prev) => subMonths(prev, 1));
	};

	const handlePrevWeek = () => {
		setCurrentMonth((prev) => subWeeks(prev, 1));
	};

	const handleNextWeek = () => {
		setCurrentMonth((prev) => addWeeks(prev, 1));
	};

	const handleNextMonth = () => {
		setCurrentMonth((prev) => addMonths(prev, 1));
	};

	const handleWeekSelect = (startDate: Date, endDate: Date) => {
		const alignedStartDate = startOfWeek(startDate, { weekStartsOn: 1 });
		setSelectedStartDate(alignedStartDate);
		setSelectedEndDate(endDate);
		setShowModal(true);
	};

	// Calculate the date range for display
	const startDisplayDate = subWeeks(startOfWeek(currentMonth, { weekStartsOn: 1 }), 1);
	const endDisplayDate = subDays(addWeeks(startOfWeek(currentMonth, { weekStartsOn: 1 }), 3 + 1), 1);
	const dateRange = `${format(startDisplayDate, "MMM d")} - ${format(endDisplayDate, "MMM d, yyyy")}`;

	return (
		<div
			className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-4 py-4"
			data-tsx-id="calendar"
		>
			<div className="flex justify-between items-center mb-2">
				<div className="flex items-center space-x-4">
					<h1 className="text-3xl font-bold text-zinc-900">
						Team Calendar: AZJP
					</h1>
					<div className="flex justify-between items-center">
						<div className="w-80 flex-1 items-center space-x-1">
							<div className="flex justify-between items-center">
								<div className="flex items-center space-x-1">
									<button
										onClick={handleToday}
										className="flex items-center px-2 py-1 space-x-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
										title="Go to today"
									>
										<CalendarIcon className="w-4 h-4" />
									</button>
									<button
										onClick={handlePrevMonth}
										className="hover:bg-zinc-100 rounded-full"
										aria-label="Previous month"
									>
										<ChevronsLeft className="w-4 h-4" />
									</button>
									<button
										onClick={handlePrevWeek}
										className="hover:bg-zinc-100 rounded-full"
										aria-label="Previous week"
									>
										<ChevronLeft className="w-4 h-4" />
									</button>
								</div>
								<span className="text-sm font-medium text-zinc-600">
									{dateRange}
								</span>
								<div className="flex items-center space-x-1">
									<button
										onClick={handleNextWeek}
										className="hover:bg-zinc-100 rounded-full"
										aria-label="Next week"
									>
										<ChevronRight className="w-4 h-4" />
									</button>
									<button
										onClick={handleNextMonth}
										className="hover:bg-zinc-100 rounded-full"
										aria-label="Next month"
									>
										<ChevronsRight className="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<MonthPicker
						currentMonth={currentMonth}
						onDateSelect={setCurrentMonth}
						weekStartsOn={weekStartsOn}
					/>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow">
				<CalendarGrid
					currentMonth={currentMonth}
					events={events}
					onDateClick={handleDateClick}
					onDateHover={handleDateHover}
					weekStartsOn={weekStartsOn}
					userSettings={currentUser?.settings}
					onEventDelete={handleEventDelete}
					currentUser={currentUser}
					onEventResize={handleEventResize}
					selectedStartDate={selectedStartDate}
					selectedEndDate={selectedEndDate}
					hoverDate={hoverDate}
					onWeekSelect={handleWeekSelect}
					availabilityData={availabilityData}
					isLoadingAvailability={isLoadingAvailability}
				/>
			</div>

			<SettingsPanel />

			{showModal && (
				<EventModal
					date={selectedStartDate!}
					endDate={selectedEndDate}
					event={selectedEvent}
					onClose={() => {
						setShowModal(false);
						resetSelection();
					}}
					onSubmit={handleCreateEvent}
					defaultEventType={
						selectedStartDate && selectedEndDate
							? "requestedHoliday"
							: undefined
					}
				/>
			)}
		</div>
	);
}