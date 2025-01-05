import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
	currentDate: Date;
	onPrevMonth: () => void;
	onNextMonth: () => void;
}

export function CalendarHeader({
	currentDate,
	onPrevMonth,
	onNextMonth,
}: CalendarHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-4">
			<h2 className="text-xl font-semibold text-zinc-900">
				{format(currentDate, "MMMM yyyy")}
			</h2>
			<div className="flex space-x-2">
				<button
					onClick={onPrevMonth}
					className="p-2 hover:bg-zinc-100 rounded-full"
				>
					<ChevronLeft className="w-5 h-5" />
				</button>
				<button
					onClick={onNextMonth}
					className="p-2 hover:bg-zinc-100 rounded-full"
				>
					<ChevronRight className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
}
