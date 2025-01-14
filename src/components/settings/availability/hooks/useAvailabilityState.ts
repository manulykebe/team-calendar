import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { WeeklySchedule } from "../../../../types/availability";
import { User } from "../../../../types/user";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export type RepeatPattern = "all" | "evenodd";

const createDefaultSchedule = () => {
	return DAYS.reduce(
		(acc, day) => ({
			...acc,
			[day]: { am: true, pm: true },
		}),
		{} as WeeklySchedule
	);
};

// Helper function to format date consistently
const formatDateString = (dateStr: string): string => {
	if (!dateStr) return "";

	// Handle dates in DD-MM-YYYY format
	if (dateStr.includes("-")) {
		const [day, month, year] = dateStr.split("-");
		if (day && month && year) {
			dateStr = `${year}-${month}-${day}`;
		}
	}

	try {
		const date = parseISO(dateStr);
		return isValid(date) ? format(date, "yyyy-MM-dd") : "";
	} catch {
		return "";
	}
};

export function useAvailabilityState(colleague: User) {
	const availability = Array.isArray(colleague.settings?.availability)
		? colleague.settings.availability
		: colleague.settings?.availability
			? [colleague.settings.availability]
			: [];

	const initialEntry = availability[0] || {
		weeklySchedule: createDefaultSchedule(),
		alternateWeekSchedule: createDefaultSchedule(),
		startDate: format(new Date(), "yyyy-MM-dd"),
		endDate: "",
		repeatPattern: "all" as const,
	};

	const [startDate, setStartDate] = useState(
		formatDateString(initialEntry.startDate)
	);
	const [endDate, setEndDate] = useState(
		formatDateString(initialEntry.endDate || "")
	);
	const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(
		initialEntry.repeatPattern || "all"
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
		return initialEntry.weeklySchedule || createDefaultSchedule();
	});

	const [alternateSchedule, setAlternateSchedule] = useState<WeeklySchedule>(
		() => {
			return (
				initialEntry.alternateWeekSchedule || createDefaultSchedule()
			);
		}
	);

	const loadEntry = (entry: any) => {
		if (!entry) return;

		// Format and set dates
		setStartDate(formatDateString(entry.startDate));
		setEndDate(formatDateString(entry.endDate || ""));

		// Set repeat pattern
		setRepeatPattern(entry.repeatPattern || "all");

		// Set schedules
		setSchedule(entry.weeklySchedule || createDefaultSchedule());
		if (entry.repeatPattern === "evenodd") {
			setAlternateSchedule(
				entry.alternateWeekSchedule || createDefaultSchedule()
			);
		} else {
			setAlternateSchedule(createDefaultSchedule());
		}
	};

	return {
		loading,
		setLoading,
		error,
		setError,
		startDate,
		setStartDate,
		endDate,
		setEndDate,
		repeatPattern,
		setRepeatPattern,
		schedule,
		setSchedule,
		alternateSchedule,
		setAlternateSchedule,
		loadEntry,
	};
}
