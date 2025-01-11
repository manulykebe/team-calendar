import { addDays, subDays, parseISO, format, isValid } from "date-fns";
import { User } from "../../../../types/user";
import { WeeklySchedule } from "../../../../types/availability";
import { useAvailabilityValidation } from "./useAvailabilityValidation";
import {
	addUserAvailabilitySchedule,
	updateUserAvailabilitySchedule,
} from "../../../../lib/api";

interface UseScheduleNavigationProps {
	token: string;
	colleague: User;
	currentEntryIndex: number;
	setCurrentEntryIndex: (index: number) => void;
	setStartDate: (date: string) => void;
	setEndDate: (date: string) => void;
	setSchedule: (schedule: WeeklySchedule) => void;
	setAlternateSchedule: (schedule: WeeklySchedule) => void;
	setError: (error: string) => void;
}

const createDefaultSchedule = (): WeeklySchedule => ({
	Monday: { am: true, pm: true },
	Tuesday: { am: true, pm: true },
	Wednesday: { am: true, pm: true },
	Thursday: { am: true, pm: true },
	Friday: { am: true, pm: true },
});

// Helper function to safely format dates
const formatDate = (date: Date | null): string => {
	if (!date || !isValid(date)) {
		return "";
	}
	return format(date, "yyyy-MM-dd");
};

// Helper function to safely parse dates
const parseDate = (dateString: string): Date | null => {
	try {
		const date = parseISO(dateString);
		return isValid(date) ? date : null;
	} catch {
		return null;
	}
};

export function useScheduleNavigation({
	token,
	colleague,
	currentEntryIndex,
	setCurrentEntryIndex,
	setStartDate,
	setEndDate,
	setSchedule,
	setAlternateSchedule,
	setError,
}: UseScheduleNavigationProps) {
	const availability = colleague.settings?.availability || [];
	const { validateSchedule } = useAvailabilityValidation();

	const handleDelete = async (extendPreceding: boolean) => {
		if (currentEntryIndex === -1) return;

		const newAvailability = [...availability];
		const deletedEntry = newAvailability[currentEntryIndex];

		if (currentEntryIndex > 0 && extendPreceding) {
			newAvailability[currentEntryIndex - 1].endDate =
				deletedEntry.endDate;
		} else if (
			currentEntryIndex < newAvailability.length - 1 &&
			!extendPreceding
		) {
			newAvailability[currentEntryIndex + 1].startDate =
				deletedEntry.startDate;
		}

		newAvailability.splice(currentEntryIndex, 1);

		for (let i = 0; i < newAvailability.length; i++) {
			const validation = validateSchedule(
				newAvailability[i].startDate,
				newAvailability[i].endDate,
				i,
				newAvailability.length,
				newAvailability
			);

			if (!validation.isValid) {
				setError(validation.error || "Invalid schedule arrangement");
				return;
			}
		}

		if (currentEntryIndex > 0) {
			setCurrentEntryIndex(currentEntryIndex - 1);
			loadEntry(newAvailability[currentEntryIndex - 1]);
		} else {
			resetToNew();
		}
	};

	const handleAdd = async (atStart: boolean, splitDate?: string) => {
		console.log(splitDate);
		debugger;
		const today = new Date();
		const newEntry = {
			weeklySchedule: createDefaultSchedule(),
			startDate: "",
			endDate: "",
			repeatPattern: "all" as const,
		};

		if (atStart && availability.length > 0) {
			const firstStartDate = parseDate(availability[0].startDate);
			if (!firstStartDate) {
				setError("Invalid start date in first schedule");
				return;
			}

			const endDate = subDays(firstStartDate, 1);
			const startDate = subDays(endDate, 7);

			newEntry.endDate = formatDate(endDate);
			newEntry.startDate = formatDate(startDate);
		} else if (!atStart && availability.length > 0) {
			const lastEntry = availability[availability.length - 1];
			const lastDate = parseDate(lastEntry.endDate || splitDate);
			if (!lastDate) {
				setError("Invalid date in last schedule");
				return;
			}
			if (!lastEntry.endDate) {
				lastEntry.endDate = formatDate(lastDate);
			}
			newEntry.startDate = formatDate(addDays(lastDate, 1));

			await updateUserAvailabilitySchedule(
				token,
				colleague.id,
				availability.length - 1,
				lastEntry
			);
		} else {
			// No existing schedules
			newEntry.startDate = formatDate(today);
			if (atStart) {
				newEntry.endDate = formatDate(addDays(today, 7));
			}
		}

		if (!newEntry.startDate) {
			setError("Failed to create valid schedule dates");
			return;
		}

		const validation = validateSchedule(
			newEntry.startDate,
			newEntry.endDate,
			atStart ? 0 : availability.length,
			availability.length + 1,
			[
				...(atStart ? [newEntry] : []),
				...availability,
				...(atStart ? [] : [newEntry]),
			]
		);

		if (!validation.isValid) {
			setError(validation.error || "Invalid schedule arrangement");
			return;
		}

		await addUserAvailabilitySchedule(
			token,
			colleague.id,
			atStart ? -1 : availability.length,
			newEntry
		);
		loadEntry(newEntry);
	};

	const handleSplit = async (splitDate: string) => {
		if (currentEntryIndex === -1) return;

		const splitDateObj = parseDate(splitDate);
		if (!splitDateObj) {
			setError("Invalid split date");
			return;
		}

		const currentEntry = availability[currentEntryIndex];
		const firstHalf = {
			...currentEntry,
			endDate: splitDate,
		};

		const secondHalf = {
			...currentEntry,
			startDate: formatDate(addDays(splitDateObj, 1)),
			endDate:
				currentEntryIndex === availability.length - 1
					? ""
					: currentEntry.endDate,
		};

		const newAvailability = [
			...availability.slice(0, currentEntryIndex),
			firstHalf,
			secondHalf,
			...availability.slice(currentEntryIndex + 1),
		];

		const validation1 = validateSchedule(
			firstHalf.startDate,
			firstHalf.endDate,
			currentEntryIndex,
			newAvailability.length,
			newAvailability
		);

		const validation2 = validateSchedule(
			secondHalf.startDate,
			secondHalf.endDate,
			currentEntryIndex + 1,
			newAvailability.length,
			newAvailability
		);

		if (!validation1.isValid) {
			setError(validation1.error || "Invalid first half of split");
			return;
		}

		if (!validation2.isValid) {
			setError(validation2.error || "Invalid second half of split");
			return;
		}

		loadEntry(firstHalf);
	};

	const loadEntry = (entry: any) => {
		if (!entry) return;

		setStartDate(entry.startDate);
		setEndDate(entry.endDate || "");
		setSchedule(entry.weeklySchedule || createDefaultSchedule());
		setAlternateSchedule(
			entry.alternateWeekSchedule || createDefaultSchedule()
		);
	};

	const resetToNew = () => {
		setStartDate("");
		setEndDate("");
		setSchedule(createDefaultSchedule());
		setAlternateSchedule(createDefaultSchedule());
	};

	return {
		handleDelete,
		handleAdd,
		handleSplit,
	};
}
