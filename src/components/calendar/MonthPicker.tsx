import { useState, useEffect } from "react";
import {
	format,
	addMonths,
	startOfMonth,
	isSameDay,
	addYears,
	parseISO,
	isAfter,
	isBefore,
	isWithinInterval,
	getMonth,
} from "date-fns";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Calendar,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { getPeriods } from "../../lib/api/periods";
import { Period } from "../../types/period";
import { useTranslation } from "../../context/TranslationContext";
import { formatDateWithLocale } from "../../utils/calendar";

interface MonthPickerProps {
	currentMonth: Date;
	onDateSelect: (date: Date) => void;
	weekStartsOn: string;
}

// Define the date range constants
const BEGIN_PICKER_DATE = parseISO("2024-11-11");
const END_PICKER_DATE = parseISO("2028-06-30");

export function MonthPicker({
	currentMonth,
	onDateSelect,
	weekStartsOn,
}: MonthPickerProps) {
	const { token } = useAuth();
	const { currentUser } = useApp();
	const { t, language } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [baseMonth, setBaseMonth] = useState(startOfMonth(currentMonth));
	const [isHovered, setIsHovered] = useState(false);
	const [periods, setPeriods] = useState<Period[]>([]);
	const [loadingPeriods, setLoadingPeriods] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date>(currentMonth);
	const [loadedYears, setLoadedYears] = useState<Set<number>>(new Set());

	const weekStartsOnNumber =
		{
			Monday: 1,
			Sunday: 0,
			Saturday: 6,
		}[weekStartsOn] || 1;

	// Update selected date when currentMonth changes
	useEffect(() => {
		setSelectedDate(currentMonth);
	}, [currentMonth]);

	// Load periods for multiple years when component mounts or when baseMonth changes
	useEffect(() => {
		const loadPeriodsForVisibleYears = async () => {
			if (!token || !currentUser || !isOpen) return;

			try {
				setLoadingPeriods(true);
				
				// Calculate which years are visible in the current 3-month view
				const months = [
					baseMonth,
					addMonths(baseMonth, 1),
					addMonths(baseMonth, 2),
				];
				
				const visibleYears = new Set(months.map(month => month.getFullYear()));
				const yearsToLoad = Array.from(visibleYears).filter(year => !loadedYears.has(year));
				
				if (yearsToLoad.length === 0) {
					setLoadingPeriods(false);
					return;
				}

				// Load periods for all visible years
				const periodPromises = yearsToLoad.map(year => 
					getPeriods(token, currentUser.site, year).catch(error => {
						console.error(`Failed to load periods for year ${year}:`, error);
						return { periods: [] };
					})
				);

				const periodResults = await Promise.all(periodPromises);
				
				// Combine all periods from different years
				const allNewPeriods = periodResults.flatMap(result => result.periods || []);
				
				// Update periods state by merging with existing periods
				setPeriods(prevPeriods => {
					// Remove periods from years we're reloading to avoid duplicates
					const filteredPrevPeriods = prevPeriods.filter(period => {
						const periodYear = new Date(period.startDate).getFullYear();
						return !yearsToLoad.includes(periodYear);
					});
					
					return [...filteredPrevPeriods, ...allNewPeriods];
				});
				
				// Mark these years as loaded
				setLoadedYears(prev => new Set([...prev, ...yearsToLoad]));
				
			} catch (error) {
				console.error("Failed to load periods:", error);
			} finally {
				setLoadingPeriods(false);
			}
		};

		loadPeriodsForVisibleYears();
	}, [token, currentUser, baseMonth, isOpen, loadedYears]);

	// Check if a date is within an open editing period
	const isDateOpenForEditing = (date: Date): boolean => {
		return periods.some(period => {
			if (period.editingStatus === 'closed') return false;
			
			try {
				const periodStart = parseISO(period.startDate);
				const periodEnd = parseISO(period.endDate);
				return isWithinInterval(date, { start: periodStart, end: periodEnd });
			} catch (error) {
				return false;
			}
		});
	};

	// Get the editing status for a date
	const getDateEditingStatus = (date: Date): string | null => {
		const period = periods.find(period => {
			try {
				const periodStart = parseISO(period.startDate);
				const periodEnd = parseISO(period.endDate);
				return isWithinInterval(date, { start: periodStart, end: periodEnd });
			} catch (error) {
				return false;
			}
		});

		return period?.editingStatus || null;
	};

	// Find the first available date for a specific editing status
	const findFirstAvailableDate = (editingStatus: 'open-holiday' | 'open-desiderata'): Date | null => {
		const relevantPeriods = periods.filter(period => period.editingStatus === editingStatus);
		
		if (relevantPeriods.length === 0) return null;

		// Sort periods by start date and find the earliest one
		const sortedPeriods = relevantPeriods.sort((a, b) => 
			new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
		);

		try {
			const firstPeriod = sortedPeriods[0];
			const startDate = parseISO(firstPeriod.startDate);
			
			// Make sure it's within our allowed date range
			if (isAfter(startDate, END_PICKER_DATE) || isBefore(startDate, BEGIN_PICKER_DATE)) {
				return null;
			}
			
			return startDate;
		} catch (error) {
			return null;
		}
	};

	// Find the first available date in the visible months
	const findFirstAvailableDateInVisibleMonths = (): Date | null => {
		const months = [
			baseMonth,
			addMonths(baseMonth, 1),
			addMonths(baseMonth, 2),
		];

		for (const month of months) {
			const start = new Date(month.getFullYear(), month.getMonth(), 1);
			const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

			for (let day = 1; day <= end.getDate(); day++) {
				const date = new Date(month.getFullYear(), month.getMonth(), day);
				
				// Check if date is within allowed range
				if (isAfter(date, END_PICKER_DATE) || isBefore(date, BEGIN_PICKER_DATE)) {
					continue;
				}

				// Check if date has open editing status
				if (isDateOpenForEditing(date)) {
					return date;
				}
			}
		}

		return null;
	};

	// Auto-select first available date when baseMonth changes
	useEffect(() => {
		if (!isOpen || periods.length === 0) return;

		const firstAvailable = findFirstAvailableDateInVisibleMonths();
		if (firstAvailable && !isSameDay(firstAvailable, selectedDate)) {
			setSelectedDate(firstAvailable);
			onDateSelect(firstAvailable);
		}
	}, [baseMonth, periods, isOpen]);

	// Handle clicking on editing status indicators
	const handleEditingStatusClick = (editingStatus: 'open-holiday' | 'open-desiderata') => {
		const firstAvailableDate = findFirstAvailableDate(editingStatus);
		
		if (firstAvailableDate) {
			// Update all states to ensure proper highlighting
			setSelectedDate(firstAvailableDate);
			setBaseMonth(startOfMonth(firstAvailableDate));
			onDateSelect(firstAvailableDate);
			// Keep the panel open for better UX
		}
	};

	const handleToday = () => {
		const today = new Date();
		let targetDate = today;
		
		if (isAfter(today, END_PICKER_DATE)) {
			targetDate = END_PICKER_DATE;
		} else if (isBefore(today, BEGIN_PICKER_DATE)) {
			targetDate = BEGIN_PICKER_DATE;
		}
		
		setSelectedDate(targetDate);
		onDateSelect(targetDate);
		setBaseMonth(startOfMonth(targetDate));
	};

	const handlePrevYear = () => {
		const newDate = addYears(baseMonth, -1);
		if (!isBefore(newDate, BEGIN_PICKER_DATE)) {
			setBaseMonth(newDate);
		} else {
			setBaseMonth(startOfMonth(BEGIN_PICKER_DATE));
		}
	};

	const handleNextYear = () => {
		const newDate = addYears(baseMonth, 1);
		if (!isAfter(newDate, END_PICKER_DATE)) {
			setBaseMonth(newDate);
		} else {
			setBaseMonth(startOfMonth(END_PICKER_DATE));
		}
	};

	const handlePrevMonth = () => {
		const newDate = addMonths(baseMonth, -1);
		if (!isBefore(newDate, BEGIN_PICKER_DATE)) {
			setBaseMonth(newDate);
		} else {
			setBaseMonth(startOfMonth(BEGIN_PICKER_DATE));
		}
	};

	const handleNextMonth = () => {
		const newDate = addMonths(baseMonth, 1);
		if (!isAfter(newDate, END_PICKER_DATE)) {
			setBaseMonth(newDate);
		} else {
			setBaseMonth(startOfMonth(END_PICKER_DATE));
		}
	};

	const handleDateClick = (date: Date) => {
		if (isAfter(date, END_PICKER_DATE) || isBefore(date, BEGIN_PICKER_DATE)) {
			return;
		}
		
		setSelectedDate(date);
		onDateSelect(date);
		// Keep the panel open for better UX
	};

	// Get translated month name
	const getMonthName = (date: Date) => {
		const monthIndex = getMonth(date);
		const monthKeys = [
			'months.january',
			'months.february',
			'months.march',
			'months.april',
			'months.may',
			'months.june',
			'months.july',
			'months.august',
			'months.september',
			'months.october',
			'months.november',
			'months.december'
		];
		
		return t(monthKeys[monthIndex]);
	};

	// Get translated day abbreviation
	const getDayAbbreviation = (dayIndex: number) => {
		const dayKeys = ['days.sun', 'days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat'];
		return t(dayKeys[dayIndex]);
	};

	const renderMonth = (monthDate: Date) => {
		const daysInMonth = [];
		const start = new Date(
			monthDate.getFullYear(),
			monthDate.getMonth(),
			1
		);
		const end = new Date(
			monthDate.getFullYear(),
			monthDate.getMonth() + 1,
			0
		);

		let firstDayOfMonth = start.getDay();
		if (firstDayOfMonth < weekStartsOnNumber) {
			firstDayOfMonth += 7;
		}
		for (let i = weekStartsOnNumber; i < firstDayOfMonth; i++) {
			daysInMonth.push(<div key={`empty-${i}`} className="h-6 w-6" />);
		}

		for (let day = 1; day <= end.getDate(); day++) {
			const date = new Date(
				monthDate.getFullYear(),
				monthDate.getMonth(),
				day
			);
			const isSelectedDate = isSameDay(date, selectedDate);
			const isToday = isSameDay(date, new Date());
			const isDisabled =
				isAfter(date, END_PICKER_DATE) ||
				isBefore(date, BEGIN_PICKER_DATE);
			
			const isOpenForEditing = !isDisabled && isDateOpenForEditing(date);
			const editingStatus = getDateEditingStatus(date);

			// Determine the styling based on editing status
			let dateClasses = "h-6 w-6 rounded-full text-xs flex items-center justify-center relative transition-all duration-200";
			let indicatorClasses = "";

			if (isDisabled) {
				dateClasses += " text-zinc-300 cursor-not-allowed";
			} else if (isSelectedDate) {
				dateClasses += " bg-blue-600 text-white";
			} else if (isToday) {
				dateClasses += " text-blue-600 font-semibold ring-1 ring-blue-600";
			} else {
				dateClasses += " hover:bg-zinc-100 cursor-pointer";
			}

			// Add editing status indicator
			if (isOpenForEditing && editingStatus) {
				switch (editingStatus) {
					case 'open-holiday':
						indicatorClasses = "absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full border border-white";
						break;
					case 'open-desiderata':
						indicatorClasses = "absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white";
						break;
				}
			}

			daysInMonth.push(
				<button
					key={day}
					onClick={() => handleDateClick(date)}
					disabled={isDisabled}
					className={dateClasses}
					title={
						isOpenForEditing 
							? editingStatus === 'open-holiday' 
								? t('periods.openHoliday')
								: t('periods.openDesiderata')
							: isDisabled 
								? t('calendar.dateNotAvailable')
								: format(date, 'MMMM d, yyyy')
					}
				>
					{day}
					{indicatorClasses && <div className={indicatorClasses} />}
				</button>
			);
		}

		return daysInMonth;
	};

	const months = [
		baseMonth,
		addMonths(baseMonth, 1),
		addMonths(baseMonth, 2),
	];

	return (
		<div className="relative">
			{/* Toggle button in the header */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className={`fixed top-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 z-10 transition-all duration-200`}
				aria-label={isOpen ? t('calendar.closeMonthPicker') : t('calendar.openMonthPicker')}
			>
				<Calendar
					className={`w-5 h-5 transition-colors duration-200`}
				/>
			</button>

			{/* Tooltip */}
			<div
				className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-zinc-800 rounded whitespace-nowrap transition-opacity duration-200
          ${isHovered && !isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
			>
				{isOpen ? t('calendar.closeMonthPicker') : t('calendar.openMonthPicker')}
				<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-800" />
			</div>

			{/* Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* Panel */}
			<div
				className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="flex flex-col h-full">
					<div className="flex items-center justify-between p-2 border-b">
						<h2 className="text-lg font-semibold text-zinc-900">{t('calendar.calendar')}</h2>
						<button
							onClick={() => setIsOpen(false)}
							className="p-2 hover:bg-zinc-100 rounded-full"
						>
							<Calendar className="w-5 h-5" />
						</button>
					</div>

					<div className="flex-1 overflow-hidden p-4">
						<div className="flex justify-between items-center mb-4">
							<div className="flex items-center space-x-1">
								<button
									onClick={handleToday}
									className="flex items-center px-2 py-1 space-x-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
									title={t('common.today')}
								>
									<Calendar className="w-4 h-4" />
								</button>
								<button
									onClick={handlePrevYear}
									className="hover:bg-zinc-100 rounded-full"
									aria-label={t('calendar.previousYear')}
								>
									<ChevronsLeft className="w-4 h-4" />
								</button>
								<button
									onClick={handlePrevMonth}
									className="hover:bg-zinc-100 rounded-full"
									aria-label={t('calendar.previousMonth')}
								>
									<ChevronLeft className="w-4 h-4" />
								</button>
							</div>
							<span className="text-sm font-medium">
								{getMonthName(baseMonth)} {format(baseMonth, "yyyy")} -{" "}
								{getMonthName(addMonths(baseMonth, 2))} {format(addMonths(baseMonth, 2), "yyyy")}
							</span>
							<div className="flex items-center space-x-1">
								<button
									onClick={handleNextMonth}
									className="hover:bg-zinc-100 rounded-full"
									aria-label={t('calendar.nextMonth')}
								>
									<ChevronRight className="w-4 h-4" />
								</button>
								<button
									onClick={handleNextYear}
									className="hover:bg-zinc-100 rounded-full"
									aria-label={t('calendar.nextYear')}
								>
									<ChevronsRight className="w-4 h-4" />
								</button>
							</div>
						</div>

						{/* Legend for editing status indicators with clickable navigation */}
						{periods.length > 0 && (
							<div className="mb-4 p-3 bg-zinc-50 rounded-lg">
								<h4 className="text-xs font-medium text-zinc-700 mb-2">{t('periods.editingStatus')}</h4>
								<div className="space-y-1">
									<button
										onClick={() => handleEditingStatusClick('open-holiday')}
										className="flex items-center space-x-2 text-xs w-full text-left hover:bg-zinc-100 rounded px-1 py-0.5 transition-colors"
										title={t('periods.openHoliday')}
									>
										<div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
										<span className="text-zinc-600">{t('periods.openHoliday')}</span>
									</button>
									<button
										onClick={() => handleEditingStatusClick('open-desiderata')}
										className="flex items-center space-x-2 text-xs w-full text-left hover:bg-zinc-100 rounded px-1 py-0.5 transition-colors"
										title={t('periods.openDesiderata')}
									>
										<div className="w-2 h-2 bg-green-400 rounded-full"></div>
										<span className="text-zinc-600">{t('periods.openDesiderata')}</span>
									</button>
								</div>
							</div>
						)}

						<div className="space-y-2">
							{loadingPeriods && (
								<div className="flex justify-center py-2">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
								</div>
							)}
							{months.map((month) => (
								<div
									key={month.toString()}
									className="text-center"
								>
									<div className="text-sm font-medium mb-2">
										{getMonthName(month)} {format(month, "yyyy")}
									</div>
									<div className="grid grid-cols-7 gap-0 text-left">
										{[0, 1, 2, 3, 4, 5, 6]
											.slice(weekStartsOnNumber)
											.concat([0, 1, 2, 3, 4, 5, 6].slice(0, weekStartsOnNumber))
											.map((dayIndex) => (
												<div
													key={dayIndex}
													className="text-xs text-zinc-500 text-center py-1"
												>
													{getDayAbbreviation(dayIndex)}
												</div>
											))}
									</div>
									<div className="grid grid-cols-7 gap-0">
										{renderMonth(month)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}