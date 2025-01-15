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
} from "date-fns";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Calendar,
} from "lucide-react";

interface MonthPickerProps {
	currentMonth: Date;
	onDateSelect: (date: Date) => void;
	weekStartsOn: string;
}

// Define the date range constants
const BEGIN_PICKER_DATE = parseISO("2024-11-11");
const END_PICKER_DATE = parseISO("2028-06-30"); // Updated to June 2025

export function MonthPicker({
	currentMonth,
	onDateSelect,
	weekStartsOn,
}: MonthPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [baseMonth, setBaseMonth] = useState(startOfMonth(currentMonth));
	const [isHovered, setIsHovered] = useState(false);

	// useEffect(() => {
	// 	if (
	// 		Math.abs(baseMonth.getTime() - currentMonth.getTime()) >
	// 		1000 * 60 * 60 * 24 * 90
	// 	) {
	// 		setBaseMonth(startOfMonth(currentMonth));
	// 	}
	// }, [currentMonth, baseMonth]);

	const weekStartsOnNumber =
		{
			Monday: 1,
			Sunday: 0,
			Saturday: 6,
		}[weekStartsOn] || 1;

	const handleToday = () => {
		const today = new Date();
		if (isAfter(today, END_PICKER_DATE)) {
			onDateSelect(END_PICKER_DATE);
			setBaseMonth(startOfMonth(END_PICKER_DATE));
		} else if (isBefore(today, BEGIN_PICKER_DATE)) {
			onDateSelect(BEGIN_PICKER_DATE);
			setBaseMonth(startOfMonth(BEGIN_PICKER_DATE));
		} else {
			onDateSelect(today);
			setBaseMonth(startOfMonth(today));
		}
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
		debugger
		console.log(baseMonth);
		const newDate = addMonths(baseMonth, 1);
		if (!isAfter(newDate, END_PICKER_DATE)) {
			setBaseMonth(newDate);
		} else {
			setBaseMonth(startOfMonth(END_PICKER_DATE));
		}
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
			const isSelected = isSameDay(date, currentMonth);
			const isToday = isSameDay(date, new Date());
			const isDisabled =
				isAfter(date, END_PICKER_DATE) ||
				isBefore(date, BEGIN_PICKER_DATE);

			daysInMonth.push(
				<button
					key={day}
					onClick={() => {
						if (!isDisabled) {
							onDateSelect(date);
							setIsOpen(false);
						}
					}}
					disabled={isDisabled}
					className={`h-6 w-6 rounded-full text-xs flex items-center justify-center relative
            ${
				isSelected
					? "bg-blue-600 text-white"
					: isToday
						? "text-blue-600 font-semibold"
						: isDisabled
							? "text-zinc-300 cursor-not-allowed"
							: "hover:bg-zinc-100"
			}
            ${isToday && !isSelected ? "ring-1 ring-blue-600" : ""}`}
				>
					{day}
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
				className={`p-2 rounded-full transition-all duration-200 relative
          ${isHovered ? "bg-blue-50 text-blue-600 scale-105" : "hover:bg-zinc-100"}`}
				aria-label={isOpen ? "Close month picker" : "Open month picker"}
			>
				<Calendar
					className={`w-5 h-5 transition-colors duration-200 ${isHovered ? "text-blue-600" : "text-zinc-600"}`}
				/>

				{/* Tooltip */}
				<div
					className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-zinc-800 rounded whitespace-nowrap transition-opacity duration-200
          ${isHovered && !isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
				>
					{isOpen ? "Close month picker" : "Open month picker"}
					<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-800" />
				</div>
			</button>

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
						<h2 className="text-lg font-semibold text-zinc-900"></h2>
						<button
							onClick={() => setIsOpen(false)}
							className="p-2 hover:bg-zinc-100 rounded-full"
						>
							<Calendar className="w-5 h-5" />
						</button>
					</div>
					{/* Tooltip */}
					<div
						className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-zinc-800 rounded whitespace-nowrap transition-opacity duration-200
          ${isHovered && !isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
					>
						{isOpen ? "Close month picker" : "Open month picker"}
						<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-800" />
					</div>

					<div className="flex-1 overflow-y-auto p-4">
						<div className="flex justify-between items-center mb-4">
							<div className="flex items-center space-x-1">
								<button
									onClick={handleToday}
									className="flex items-center px-2 py-1 space-x-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
									title="Go to today"
								>
									<Calendar className="w-4 h-4" />
								</button>
								<button
									onClick={handlePrevYear}
									className="hover:bg-zinc-100 rounded-full"
									aria-label="Previous year"
								>
									<ChevronsLeft className="w-4 h-4" />
								</button>
								<button
									onClick={handlePrevMonth}
									className="hover:bg-zinc-100 rounded-full"
									aria-label="Previous month"
								>
									<ChevronLeft className="w-4 h-4" />
								</button>
							</div>
							<span className="text-sm font-medium">
								{format(baseMonth, "MMM yyyy")} -{" "}
								{format(addMonths(baseMonth, 2), "MMM yyyy")}
							</span>
							<div className="flex items-center space-x-1">
								<button
									onClick={handleNextMonth}
									className="hover:bg-zinc-100 rounded-full"
									aria-label="Next month"
								>
									<ChevronRight className="w-4 h-4" />
								</button>
								<button
									onClick={handleNextYear}
									className="hover:bg-zinc-100 rounded-full"
									aria-label="Next year"
								>
									<ChevronsRight className="w-4 h-4" />
								</button>
							</div>
						</div>

						<div className="space-y-2">
							{months.map((month) => (
								<div
									key={month.toString()}
									className="text-center"
								>
									<div className="text-sm font-medium mb-2">
										{format(month, "MMMM yyyy")}
									</div>
									<div className="grid grid-cols-7 gap-0 text-center mb-1">
										{[
											"Mo",
											"Tu",
											"We",
											"Th",
											"Fr",
											"Sa",
											"Su",
										]
											.slice(weekStartsOnNumber)
											.concat(
												[
													"Mo",
													"Tu",
													"We",
													"Th",
													"Fr",
													"Sa",
													"Su",
												].slice(0, weekStartsOnNumber)
											)
											.map((day) => (
												<div
													key={day}
													className="text-xs text-zinc-500"
												>
													{day}
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
