import { User } from "../../types/user";

interface DisplaySettingsProps {
	currentUser: User | null;
	onWorkStartChange: (value: string) => void;
}

export function DisplaySettings({
	currentUser,
	onWorkStartChange,
}: DisplaySettingsProps) {
	return (
		<div>
			<h3 className="text-sm font-medium text-zinc-900 mb-2">Display</h3>
			<div className="space-y-4">
				<div className="flex items-center space-x-2">
					<label className="text-sm text-zinc-700">
						Week starts on:
					</label>
					<select
						value={currentUser?.app?.weekStartsOn || "Monday"}
						onChange={(e) => onWorkStartChange(e.target.value)}
						className="mt-1 block w-40 rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-zinc-200"
					>
						<option value="Monday">Monday</option>
						<option value="Sunday">Sunday</option>
						<option value="Saturday">Saturday</option>
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
