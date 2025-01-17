import { getWeekNumber, isStartOfWeek } from "../../utils/dateUtils";
import { WeekNumber } from "./WeekNumber";
import { Event } from "../../types/event";
import { User } from "../../types/user";

interface WeekColumnProps {
	days: Date[];
	position: "left" | "right";
	rowHeight?: number;
	onWeekClick?: (startDate: Date, endDate: Date) => void;
	events?: Event[];
	currentUser?: User | null;
	onEventDelete?: (eventId: string) => void;
}

export function WeekColumn({
	days,
	position,
	rowHeight = 120,
	onWeekClick,
	events,
	currentUser,
	onEventDelete,
}: WeekColumnProps) {
	// Get unique weeks, but only for the actual calendar days we're showing
	const uniqueWeeks = days
		.filter((day) => isStartOfWeek(day, "Monday")) // Only consider Mondays
		.reduce(
			(acc, day) => {
				const weekNum = getWeekNumber(day);
				if (!acc.some((w) => w.weekNum === weekNum)) {
					//Week starts on Monday
					acc.push({ weekNum, day });
				}
				return acc;
			},
			[] as { weekNum: number; day: Date }[]
		)
		.slice(0, 5); // Ensure we only show 5 weeks
	return (
		<div
			className="grid gap-px"
			style={{
				gridAutoRows: `${rowHeight}px`,
			}}
			data-tsx-id="week-column"
		>
			{uniqueWeeks.map(({ weekNum, day }) => (
				<WeekNumber
					key={weekNum}
					date={day}
					onWeekClick={onWeekClick}
					events={events}
					currentUser={currentUser}
					onEventDelete={onEventDelete}
					position={position}
				/>
			))}
		</div>
	);
}
