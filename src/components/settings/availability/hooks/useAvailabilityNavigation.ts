import { useState, useEffect } from "react";
import { User } from "../../../../types/user";
import { WeeklySchedule } from "../../../../types/availability";
import { parseISO, format, isValid } from "date-fns";

interface UseAvailabilityNavigationProps {
	colleague: User;
	setStartDate: (date: string) => void;
	setEndDate: (date: string) => void;
	setRepeatPattern: (pattern: "all" | "evenodd") => void;
	setSchedule: (schedule: WeeklySchedule) => void;
	setAlternateSchedule: (schedule: WeeklySchedule) => void;
}

const createDefaultSchedule = (): WeeklySchedule => ({
	Monday: { am: true, pm: true },
	Tuesday: { am: true, pm: true },
	Wednesday: { am: true, pm: true },
	Thursday: { am: true, pm: true },
	Friday: { am: true, pm: true },
});

// Helper function to format date consistently
const formatDateString = (dateStr: string): string => {
	if (!dateStr) return "";

	try {
		const date = parseISO(dateStr);
		return isValid(date) ? format(date, "yyyy-MM-dd") : "";
	} catch {
		return "";
	}
};

export function useAvailabilityNavigation({
	colleague,
	setStartDate,
	setEndDate,
	setRepeatPattern,
	setSchedule,
	setAlternateSchedule,
}: UseAvailabilityNavigationProps) {
	// Ensure availability is always an array
	const availability = Array.isArray(colleague.settings?.availability)
		? colleague.settings.availability
		: colleague.settings?.availability
		? [colleague.settings.availability]
		: [];

	const [currentEntryIndex, setCurrentEntryIndex] = useState(
		availability.length > 0 ? 0 : -1
	);

	// Load initial entry when component mounts or availability changes
	useEffect(() => {
		if (availability.length > 0) {
			loadEntry(availability[0]);
		}
	}, [availability]);

	const handlePrevEntry = () => {
		if (availability.length === 0 || currentEntryIndex <= 0) return;

		const newIndex = currentEntryIndex - 1;
		setCurrentEntryIndex(newIndex);
		loadEntry(availability[newIndex]);
	};

	const handleFirstEntry = () => {
		if (availability.length === 0 || currentEntryIndex === 0) return;

		const newIndex = 0;
		setCurrentEntryIndex(newIndex);
		loadEntry(availability[newIndex]);
	};

	const handleNextEntry = () => {
		if (
			availability.length === 0 ||
			currentEntryIndex >= availability.length - 1
		)
			return;

		const newIndex = currentEntryIndex + 1;
		setCurrentEntryIndex(newIndex);
		loadEntry(availability[newIndex]);
	};

	const handleLastEntry = () => {
		if (
			availability.length === 0 ||
			currentEntryIndex >= availability.length - 1
		)
			return;

		const newIndex = availability.length - 1;
		setCurrentEntryIndex(newIndex);
		loadEntry(availability[newIndex]);
	};

	const loadEntry = (entry: any) => {
		if (!entry) return;

		// Format and set dates
		const formattedStartDate = formatDateString(entry.startDate);
		const formattedEndDate = formatDateString(entry.endDate);

		setStartDate(formattedStartDate);
		setEndDate(formattedEndDate);

		// Set repeat pattern
		setRepeatPattern(entry.repeatPattern || "all");

		// Set schedules
		if (entry.weeklySchedule) {
			setSchedule(entry.weeklySchedule);
		} else {
			setSchedule(createDefaultSchedule());
		}

		if (entry.repeatPattern === "evenodd" && entry.alternateWeekSchedule) {
			setAlternateSchedule(entry.alternateWeekSchedule);
		} else {
			setAlternateSchedule(createDefaultSchedule());
		}
	};

	return {
		currentEntryIndex,
		totalEntries: availability.length,
		handleFirstEntry,
		handlePrevEntry,
		handleNextEntry,
		handleLastEntry,
	};
}
