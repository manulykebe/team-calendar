import { Sun, Moon } from "lucide-react";
import { WeeklySchedule, TimeSlot } from "../../../../types/availability";

interface ScheduleGridProps {
	caption: string;
	schedule: WeeklySchedule;
	isAlternate?: boolean;
	onTimeSlotToggle: (
		day: keyof WeeklySchedule,
		slot: keyof TimeSlot,
		isAlternate: boolean
	) => void;
	disabled?: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export function ScheduleGrid({
	caption,
	schedule,
	isAlternate = false,
	onTimeSlotToggle,
	disabled = false,
}: ScheduleGridProps) {
	return (
		<div
			className={`grid grid-cols-6 gap-4 ${disabled ? "opacity-50" : ""}`}
		>
			<div className="col-span-1 text-center font-medium">{caption}</div>
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
						onClick={() => onTimeSlotToggle(day, "am", isAlternate)}
						className={`w-full h-12 rounded-md border ${
							schedule[day].am
								? "bg-green-100 border-green-500"
								: "bg-red-100 border-red-500"
						} ${
							disabled ? "cursor-not-allowed" : "hover:opacity-80"
						}`}
						disabled={disabled}
					>
						{schedule[day].am ? "Available" : "Unavailable"}
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
						onClick={() => onTimeSlotToggle(day, "pm", isAlternate)}
						className={`w-full h-12 rounded-md border ${
							schedule[day].pm
								? "bg-green-100 border-green-500"
								: "bg-red-100 border-red-500"
						} ${
							disabled ? "cursor-not-allowed" : "hover:opacity-80"
						}`}
						disabled={disabled}
					>
						{schedule[day].pm ? "Available" : "Unavailable"}
					</button>
				</div>
			))}
		</div>
	);
}
