import { useState } from "react";
import { X } from "lucide-react";
import { addDays, parseISO, format } from "date-fns";

interface SplitScheduleModalProps {
  startDate: string;
  endDate: string;
  onSplit: (splitDate: string) => void;
  onClose: () => void;
}

export function SplitScheduleModal({
  startDate,
  endDate,
  onSplit,
  onClose,
}: SplitScheduleModalProps) {
  const minDate = addDays(parseISO(startDate), 0);
  const maxDate = addDays(parseISO(endDate), 0);
  const middleDate = format(
    addDays(
      minDate,
      Math.floor(
        (maxDate.getTime() - minDate.getTime()) / (2 * 24 * 60 * 60 * 1000),
      ),
    ),
    "yyyy-MM-dd",
  );
  const [selectedDate, setSelectedDate] = useState(middleDate);

  const handleSplit = () => {
    if (selectedDate) {
      onSplit(selectedDate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-zinc-900">Split Schedule</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Split Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(minDate, "yyyy-MM-dd")}
              max={format(maxDate, "yyyy-MM-dd")}
              className="w-full rounded-md border-zinc-300"
            />
          </div>

          <div className="text-sm text-zinc-500">
            Select a date between {format(minDate, "MMM d, yyyy")} and{" "}
            {format(maxDate, "MMM d, yyyy")} to split the schedule.
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSplit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Split
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
