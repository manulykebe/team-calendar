import { useState } from "react";
import { format, subDays, parseISO, isBefore } from "date-fns";
import { X, Sun, Moon } from "lucide-react";
import { User } from "../../../types/user";
import { WeeklySchedule, TimeSlot } from "../../../types/availability";
import { updateUser } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

interface AvailabilityModalProps {
	colleague: User;
	onClose: () => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

type RepeatPattern = "all" | "evenodd";

export function AvailabilityModal({
	colleague,
	onClose,
}: AvailabilityModalProps) {
	const { token } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [startDate, setStartDate] = useState(
		format(new Date(), "yyyy-MM-dd")
	);
	const [endDate, setEndDate] = useState("");
	const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>("all");
	const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
		// Get the most recent availability settings or use defaults
		const availabilityArray = colleague.settings?.availability || [];
		const currentSettings =
			availabilityArray[availabilityArray.length - 1]?.weeklySchedule ||
			{};

		return DAYS.reduce(
			(acc, day) => ({
				...acc,
				[day]: currentSettings[day] || { am: true, pm: true },
			}),
			{} as WeeklySchedule
		);
	});
	const [alternateSchedule, setAlternateSchedule] = useState<WeeklySchedule>(
		() => {
			const availabilityArray = colleague.settings?.availability || [];
			const currentSettings =
				availabilityArray[availabilityArray.length - 1]
					?.alternateWeekSchedule || {};

			return DAYS.reduce(
				(acc, day) => ({
					...acc,
					[day]: currentSettings[day] || { am: true, pm: true },
				}),
				{} as WeeklySchedule
			);
		}
	);

	const handleTimeSlotToggle = (
		day: keyof WeeklySchedule,
		slot: keyof TimeSlot,
		isAlternate = false
	) => {
		const setterFunction = isAlternate ? setAlternateSchedule : setSchedule;
		setterFunction((prev) => ({
			...prev,
			[day]: {
				...prev[day],
				[slot]: !prev[day][slot],
			},
		}));
	};

	const handleSave = async () => {
		if (!token) return;

		try {
			setLoading(true);
			setError("");

			// Don't allow retrospective changes
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (isBefore(parseISO(startDate), today)) {
				throw new Error("Cannot set availability for past dates");
			}

			// Get current availability array
			debugger;
			const currentAvailability = colleague.settings?.availability || [];

			// Create new availability entry
			const newAvailability = {
				weeklySchedule: schedule,
				...(repeatPattern === "evenodd" && {
					alternateWeekSchedule: alternateSchedule,
				}),
				startDate,
				endDate,
				repeatPattern,
			};

			let updatedAvailability = [...currentAvailability];

			// Find if there's an entry with the same start date
			const existingIndex = updatedAvailability.findIndex(
				(entry) => entry.startDate === startDate
			);

			if (existingIndex !== -1) {
				// Update existing entry
				updatedAvailability[existingIndex] = newAvailability;
			} else {
				// Find the last entry that starts before this new one
				const previousIndex = updatedAvailability.findIndex((entry) =>
					isBefore(parseISO(entry.startDate), parseISO(startDate))
				);

				if (previousIndex !== -1) {
					// Update the end date of the previous entry
					updatedAvailability[previousIndex] = {
						...updatedAvailability[previousIndex],
						endDate: format(
							subDays(parseISO(startDate), 1),
							"yyyy-MM-dd"
						),
					};
				}

				// Add the new entry
				updatedAvailability.push(newAvailability);

				// Sort by start date
				updatedAvailability.sort(
					(a, b) =>
						parseISO(a.startDate).getTime() -
						parseISO(b.startDate).getTime()
				);
			}

			// Create a new settings object with the updated availability
			const updatedSettings = {
				...colleague.settings,
				availability: updatedAvailability,
			};

			// Update user settings
			await updateUser(token, colleague.id, {
				settings: updatedSettings,
			});
			onClose();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to save availability"
			);
		} finally {
			setLoading(false);
		}
	};

	const renderScheduleGrid = (isAlternate = false) => (
		<div className="grid grid-cols-6 gap-4">
			<div className="col-span-1"></div>
			{DAYS.map((day) => (
				<div key={day} className="text-center font-medium">
					{day}
				</div>
			))}

			<div className="flex items-center justify-end">
				<Sun className="w-5 h-5 text-amber-500" />
			</div>
			{DAYS.map((day) => (
				<div
					key={`${day}-am${isAlternate ? "-alt" : ""}`}
					className="text-center"
				>
					<button
						onClick={() =>
							handleTimeSlotToggle(day, "am", isAlternate)
						}
						className={`w-full h-12 rounded-md border ${
							(isAlternate ? alternateSchedule : schedule)[day].am
								? "bg-green-100 border-green-500"
								: "bg-red-100 border-red-500"
						}`}
					>
						{(isAlternate ? alternateSchedule : schedule)[day].am
							? "Available"
							: "Unavailable"}
					</button>
				</div>
			))}

			<div className="flex items-center justify-end">
				<Moon className="w-5 h-5 text-blue-500" />
			</div>
			{DAYS.map((day) => (
				<div
					key={`${day}-pm${isAlternate ? "-alt" : ""}`}
					className="text-center"
				>
					<button
						onClick={() =>
							handleTimeSlotToggle(day, "pm", isAlternate)
						}
						className={`w-full h-12 rounded-md border ${
							(isAlternate ? alternateSchedule : schedule)[day].pm
								? "bg-green-100 border-green-500"
								: "bg-red-100 border-red-500"
						}`}
					>
						{(isAlternate ? alternateSchedule : schedule)[day].pm
							? "Available"
							: "Unavailable"}
					</button>
				</div>
			))}
		</div>
	);

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
				<div className="flex justify-between items-center p-6 border-b">
					<h2 className="text-xl font-semibold text-zinc-900">
						Set Availability for {colleague.firstName}{" "}
						{colleague.lastName}
					</h2>
					<button
						onClick={onClose}
						className="text-zinc-400 hover:text-zinc-500"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					{error && (
						<div className="p-4 text-red-600 bg-red-50 rounded-md">
							{error}
						</div>
					)}

					<div className="grid grid-cols-8 gap-4">
						<div className="col-span-8 sm:col-span-2">
							<label className="block text-sm font-medium text-zinc-700 mb-2">
								Start Date
							</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								min={format(new Date(), "yyyy-MM-dd")}
								className="w-full rounded-md border-zinc-300"
							/>
						</div>
						<div className="col-span-8 sm:col-span-2">
							<label className="block text-sm font-medium text-zinc-700 mb-2">
								End Date
							</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								min={startDate}
								className="w-full rounded-md border-zinc-300"
							/>
						</div>
						<div className="col-span-8 sm:col-span-4">
							<label className="block text-sm font-medium text-zinc-700 mb-2">
								Repeat Pattern
							</label>
							<select
								value={repeatPattern}
								onChange={(e) =>
									setRepeatPattern(
										e.target.value as RepeatPattern
									)
								}
								className="w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							>
								<option value="all">All Weeks</option>
								<option value="evenodd">Even/Odd Weeks</option>
							</select>
						</div>
					</div>

					<div className="space-y-8">
						{repeatPattern === "evenodd" && (
							<div>
								<h3 className="text-lg font-medium text-zinc-900 mb-4">
									Even Weeks
								</h3>
								{renderScheduleGrid(false)}
							</div>
						)}

						<div>
							<h3 className="text-lg font-medium text-zinc-900 mb-4">
								{repeatPattern === "all"
									? "Weekly Schedule"
									: "Odd Weeks"}
							</h3>
							{renderScheduleGrid(repeatPattern === "evenodd")}
						</div>
					</div>
				</div>

				<div className="flex justify-end space-x-3 p-6 border-t">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
						disabled={loading}
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={loading}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? "Saving..." : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
