import { useState } from "react";
import { format } from "date-fns";
import { X, Sun, Moon } from "lucide-react";
import { User } from "../../../types/user";
import { WeeklySchedule, TimeSlot } from "../../../types/availability";
import { updateUser } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

interface AvailabilityModalProps {
  colleague: User;
  onClose: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

type RepeatPattern = 'all' | 'evenodd';

export function AvailabilityModal({ colleague, onClose }: AvailabilityModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(colleague.settings?.availability?.startDate || format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(colleague.settings?.availability?.endDate || "");
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(
    colleague.settings?.availability?.repeatPattern as RepeatPattern || 'all'
  );
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    const defaultSchedule = colleague.settings?.availability?.weeklySchedule || {};
    return DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: defaultSchedule[day] || { am: true, pm: true }
    }), {} as WeeklySchedule);
  });
  const [alternateSchedule, setAlternateSchedule] = useState<WeeklySchedule>(() => {
    const defaultSchedule = colleague.settings?.availability?.alternateWeekSchedule || {};
    return DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: defaultSchedule[day] || { am: true, pm: true }
    }), {} as WeeklySchedule);
  });

  const handleTimeSlotToggle = (day: keyof WeeklySchedule, slot: keyof TimeSlot, isAlternate = false) => {
    const setterFunction = isAlternate ? setAlternateSchedule : setSchedule;
    setterFunction(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: !prev[day][slot]
      }
    }));
  };

  const handleSave = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError("");

      // Create a new settings object with only the availability update
      const updatedSettings = {
        ...colleague.settings,
        availability: {
          weeklySchedule: schedule,
          ...(repeatPattern === 'evenodd' && {
            alternateWeekSchedule: alternateSchedule
          }),
          startDate,
          endDate,
          repeatPattern
        }
      };

      // Only send the settings update, not the full user object
      await updateUser(token, colleague.id, { settings: updatedSettings });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability");
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
        <div key={`${day}-am${isAlternate ? '-alt' : ''}`} className="text-center">
          <button
            onClick={() => handleTimeSlotToggle(day, 'am', isAlternate)}
            className={`w-full h-12 rounded-md border ${
              (isAlternate ? alternateSchedule : schedule)[day].am
                ? 'bg-green-100 border-green-500'
                : 'bg-red-100 border-red-500'
            }`}
          >
            {(isAlternate ? alternateSchedule : schedule)[day].am ? 'Available' : 'Unavailable'}
          </button>
        </div>
      ))}

      <div className="flex items-center justify-end">
        <Moon className="w-5 h-5 text-blue-500" />
      </div>
      {DAYS.map((day) => (
        <div key={`${day}-pm${isAlternate ? '-alt' : ''}`} className="text-center">
          <button
            onClick={() => handleTimeSlotToggle(day, 'pm', isAlternate)}
            className={`w-full h-12 rounded-md border ${
              (isAlternate ? alternateSchedule : schedule)[day].pm
                ? 'bg-green-100 border-green-500'
                : 'bg-red-100 border-red-500'
            }`}
          >
            {(isAlternate ? alternateSchedule : schedule)[day].pm ? 'Available' : 'Unavailable'}
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
            Set Availability for {colleague.firstName} {colleague.lastName}
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
            <div className="p-4 text-red-600 bg-red-50 rounded">
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
                onChange={(e) => setRepeatPattern(e.target.value as RepeatPattern)}
                className="w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Weeks</option>
                <option value="evenodd">Even/Odd Weeks</option>
              </select>
            </div>
          </div>

          <div className="space-y-8">
            {repeatPattern === 'evenodd' && (
              <div>
                <h3 className="text-lg font-medium text-zinc-900 mb-4">Even Weeks</h3>
                {renderScheduleGrid(false)}
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium text-zinc-900 mb-4">
                {repeatPattern === 'all' ? 'Weekly Schedule' : 'Odd Weeks'}
              </h3>
              {renderScheduleGrid(repeatPattern === 'evenodd')}
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