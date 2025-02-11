import { format, getMonth, getDay } from "date-fns";
import { getWeekNumber } from "../../../utils/dateUtils";
import { X } from "lucide-react";
import { updateAvailabilityException } from "../../../lib/api/users";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { userSettingsEmitter } from "../../../hooks/useColleagueSettings";
import { useState, useEffect } from "react";
import { User } from "../../../types";

interface AvailabilityReportProps {
	data: {
		year: string;
		userId: string;
		workWeekDays: string[];
		dayParts: string[];
		availability: {
			[key: string]: {
				am: boolean;
				pm: boolean;
			};
		};
	};
	colleague: User;
	onClose: () => void;
}

export function AvailabilityReport({ data, colleague, onClose }: AvailabilityReportProps) {
	const { token } = useAuth();
	const dayHeaders = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	// Track both clicked slots and their current values
	const [slotStates, setSlotStates] = useState<Record<string, boolean>>({});
	const [loadingSlots, setLoadingSlots] = useState<Record<string, boolean>>(
		{}
	);

	// Initialize slot states from data
	useEffect(() => {
		const initialStates: Record<string, boolean> = {};
		Object.entries(data.availability).forEach(([date, dayData]) => {
			["am", "pm"].forEach((part) => {
				const slotKey = `${date}-${part}`;
				initialStates[slotKey] = dayData[part as keyof typeof dayData];
			});
		});
		setSlotStates(initialStates);
	}, [data]);

	const handleTimeSlotClick = async (
		dateStr: string,
		part: "am" | "pm",
		currentValue: boolean
	) => {
		if (!token) return;

		const slotKey = `${dateStr}-${part}`;
		const newValue = !currentValue;

		// Update loading state
		setLoadingSlots((prev) => ({ ...prev, [slotKey]: true }));

		try {
			await updateAvailabilityException(token, data.userId, {
				date: dateStr,
				part,
				value: newValue,
			});

			// Update local state
			setSlotStates((prev) => ({ ...prev, [slotKey]: newValue }));

			// Emit event to update settings
			userSettingsEmitter.emit("availabilityChanged", {
				userId: data.userId,
				type: "exception",
				data: {
					date: dateStr,
					part,
					value: newValue,
				},
			});

			toast.success("Availability updated");
		} catch (error) {
			console.error("Failed to update availability:", error);
			toast.error("Failed to update availability");
			// Don't update state on error
		} finally {
			setLoadingSlots((prev) => ({ ...prev, [slotKey]: false }));
		}
	};

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
			data-tsx-id="availability-report"
		>
			<div className="bg-white rounded-lg shadow-xl max-w-[1400px] w-full max-h-[90vh] overflow-auto">
				<div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b">
					<h2 className="text-xl font-semibold text-zinc-900">
						Availability Report for {colleague.firstName} {colleague.lastName} - {data.year}
					</h2>
					<button
						onClick={onClose}
						className="text-zinc-400 hover:text-zinc-500"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="p-6">
					<div className="w-full">
						{/* Header row with day names */}
						<div className="grid grid-cols-[100px_repeat(37,1fr)] border-b">
							<div className="p-2"></div>
							{[...Array(5)].map((_, weekIndex) =>
								dayHeaders.map((day, i) => (
									<div
										key={`header-${weekIndex}-${i}`}
										className="text-center font-medium p-2 text-xs"
									>
										{day}
									</div>
								))
							)}
						</div>

						{/* Month rows */}
						{months.map((monthName, monthIndex) => {
							const firstDayOfMonth = new Date(
								parseInt(data.year),
								monthIndex,
								1
							);
							const adjustedWeekday =
								getMondayBasedDay(firstDayOfMonth);

							return (
								<div
									key={monthName}
									className="grid grid-cols-[100px_repeat(37,1fr)] border-b"
								>
									<div className="p-2 font-medium">
										{monthName}
									</div>
									{Array(37)
										.fill(0)
										.map((_, index) => {
											const dayOffset =
												index - adjustedWeekday;
											const currentDate = new Date(
												firstDayOfMonth
											);
											currentDate.setDate(1 + dayOffset);

											if (
												getMonth(currentDate) !==
												monthIndex
											) {
												return (
													<div
														key={index}
														className="p-2"
													/>
												);
											}

											const dateStr = format(
												currentDate,
												"yyyy-MM-dd"
											);
											const dayData =
												data.availability[dateStr];
											const dayOfWeek =
												getMondayBasedDay(currentDate);
											const isWeekend = dayOfWeek >= 5; // 5=Sat, 6=Sun
											const weekNumber =
												getWeekNumber(currentDate);
											const isEvenWeek =
												weekNumber % 2 === 0;
											return (
												<div
													key={index}
													className={`p-1 border-r border-zinc-100 ${
														isEvenWeek
															? "bg-zinc-50"
															: ""
													}`}
													title={format(
														currentDate,
														"MMMM d, yyyy"
													)}
												>
													<div className="text-xs text-center">
														{format(
															currentDate,
															"d"
														)}
													</div>
													<div className="space-y-0.5 mt-1">
														{data.dayParts.map(
															(part) => {
																const slotKey = `${dateStr}-${part}`;
																const isLoading =
																	loadingSlots[
																		slotKey
																	];
																const currentValue =
																	slotStates[
																		slotKey
																	] ??
																	dayData?.[
																		part as keyof typeof dayData
																	] ??
																	false;

																return (
																	<button
																		key={
																			part
																		}
																		onClick={() =>
																			handleTimeSlotClick(
																				dateStr,
																				part as
																					| "am"
																					| "pm",
																				currentValue
																			)
																		}
																		className={`h-1.5 w-full transition-colors cursor-pointer ${
																			isLoading
																				? "bg-yellow-500"
																				: currentValue
																					? "bg-green-500 hover:bg-green-600"
																					: isWeekend
																						? "bg-zinc-200"
																						: "bg-red-500 hover:bg-red-600"
																		} rounded-sm`}
																		disabled={
																			isWeekend ||
																			isLoading
																		}
																		title={`${format(currentDate, "MMM d")} ${part.toUpperCase()}`}
																	/>
																);
															}
														)}
													</div>
												</div>
											);
										})}
								</div>
							);
						})}
					</div>

					{/* Legend */}
					<div className="mt-6 space-y-4">
						<div className="flex items-center space-x-6 text-sm">
							<div className="flex items-center space-x-2">
								<div className="w-4 h-4 bg-green-500 rounded" />
								<span>Available</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className="w-4 h-4 bg-red-500 rounded" />
								<span>Unavailable</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className="w-4 h-4 bg-zinc-200 rounded" />
								<span>Weekend</span>
							</div>
						</div>
						<div className="text-sm text-zinc-600">
							Click on time slots to toggle individual updates.
							Changes are saved automatically.
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Helper to convert Sunday=0 to Monday=0
const getMondayBasedDay = (date: Date): number => {
	const day = getDay(date);
	return day === 0 ? 6 : day - 1;
};
