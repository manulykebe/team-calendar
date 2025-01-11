import { useState } from 'react';
import { X } from 'lucide-react';
import { addDays, parseISO, format, isValid } from 'date-fns';

interface AddScheduleSplitModalProps {
  lastScheduleEndDate: string;
  onSplit: (splitDate: string) => void;
  onClose: () => void;
}

export function AddScheduleSplitModal({
  lastScheduleEndDate,
  onSplit,
  onClose,
}: AddScheduleSplitModalProps) {
  const [selectedDate, setSelectedDate] = useState(lastScheduleEndDate || format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState<string | null>(null);

  const getNextDayText = () => {
    try {
      const date = parseISO(selectedDate);
      if (!isValid(date)) {
        return 'Invalid date selected';
      }
      return format(addDays(date, 1), 'MMM d, yyyy');
    } catch {
      return 'Invalid date selected';
    }
  };

  const handleSplit = () => {
    try {
      const date = parseISO(selectedDate);
      if (!isValid(date)) {
        setError('Please select a valid date');
        return;
      }
      
      const minDate = parseISO(lastScheduleEndDate);
      if (isValid(minDate) && date < minDate) {
        setError('Selected date cannot be before the last schedule end date');
        return;
      }

      onSplit(selectedDate);
      onClose();
    } catch (err) {
      setError('Invalid date selected');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-zinc-900">Add New Schedule</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              End Date for Current Schedule
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError(null);
              }}
              min={lastScheduleEndDate}
              className="w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="text-sm text-zinc-500">
            The new schedule will start on {getNextDayText()}
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
              Add Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}