import { User } from "../../types/user";

interface DisplaySettingsProps {
  currentUser: User | null;
  onWorkStartChange: (value: string) => void;
  onWeekNumberChange: (value: "left" | "right" | "none") => void;
}

export function DisplaySettings({
  currentUser,
  onWorkStartChange,
  onWeekNumberChange,
}: DisplaySettingsProps) {
  return (
    <div data-tsx-id="display-settings">
      <h3 className="text-sm font-medium text-zinc-900 mb-2">Display</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-zinc-700">Week starts on:</label>
          <select
            value={currentUser?.app?.weekStartsOn || "Monday"}
            onChange={(e) => onWorkStartChange(e.target.value)}
            className="mt-1 block w-40 rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="Monday">Monday</option>
            <option value="Sunday">Sunday</option>
            <option value="Saturday">Saturday</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm text-zinc-700">Show week number:</label>
          <select
            value={currentUser?.settings?.showWeekNumber || "right"}
            onChange={(e) =>
              onWeekNumberChange(e.target.value as "left" | "right" | "none")
            }
            className="mt-1 block w-40 rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="none">None</option>
          </select>
        </div>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="rounded border-zinc-300 text-blue-600"
          />
          <span className="text-sm text-zinc-700">Show weekends</span>
        </label>
      </div>
    </div>
  );
}
