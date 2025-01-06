import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { X } from "lucide-react";
import { Event } from "../types/event";

interface EventModalProps {
	date: Date;
	event?: Event;
	onClose: () => void;
	onSubmit: (data: {
		title: string;
		description: string;
		date: string;
		endDate?: string;
		type: string;
	}) => Promise<void>;
}

export function EventModal({
	date,
	event,
	onClose,
	onSubmit,
}: EventModalProps) {
	const [title, setTitle] = useState(event?.title || "");
	const [description, setDescription] = useState(event?.description || "");
	const [endDate, setEndDate] = useState(event?.endDate || "");
	const [type, setType] = useState(event?.type || "requestedPeriod");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const eventTypes = {
		requestedHoliday: { period: "week-Saturday[-1]-Sunday[1]" },
		requestedHolidayMandatory: { period: "week-Saturday[-1]-Sunday[1]" },
		requestedPeriod: { period: "day|days[1-7]" },
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setLoading(true);
			setError("");

			// Adjust start date for holiday types
			let startDate = new Date(date);
			if (type === "requestedHoliday" || type === "requestedHolidayMandatory") {
				// Find previous Saturday
				while (startDate.getDay() !== 6) { // 6 is Saturday
					startDate = subDays(startDate, 1);
				}
			}

			const eventData = {
				title: title.trim(),
				description: description.trim(),
				date: format(startDate, "yyyy-MM-dd"),
				endDate: endDate || undefined,
				type,
			};

			await onSubmit(eventData);
			onClose();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to save event"
			);
		} finally {
			setLoading(false);
		}
	};

	// Update endDate based on event type selection
	useEffect(() => {
		if (
			type === "requestedHoliday" ||
			type === "requestedHolidayMandatory"
		) {
			// Find previous Saturday
			let startDate = new Date(date);
			while (startDate.getDay() !== 6) { // 6 is Saturday
				startDate = subDays(startDate, 1);
			}

			// Set endDate to the following Sunday (7 days later)
			const weekEnd = new Date(date);
			weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
			setEndDate(format(weekEnd, "yyyy-MM-dd"));

			date = startDate;
		} else {
			// Reset endDate when switching to requestedPeriod
			setEndDate("");
		}
	}, [type, date]);

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
				<div className="flex justify-between items-center p-4 border-b">
					<h3 className="text-lg font-semibold text-zinc-900">
						{event ? "Edit Event" : "Add Event"} -{" "}
						{format(date, "MMMM d, yyyy")}
					</h3>
					<button
						onClick={onClose}
						className="text-zinc-400 hover:text-zinc-500"
						disabled={loading}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-4 space-y-4">
					{error && (
						<div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
							{error}
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-zinc-700">
							Event Type *
						</label>
						<select
							value={type}
							onChange={(e) => setType(e.target.value)}
							className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							disabled={loading}
						>
							{Object.keys(eventTypes).map((typeId) => (
								<option key={typeId} value={typeId}>
									{typeId
										.replace(/([A-Z])/g, " $1")
										.replace(/^./, (str) =>
											str.toUpperCase()
										)}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="title"
							className="block text-sm font-medium text-zinc-700"
						>
							Title
						</label>
						<input
							type="text"
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							maxLength={100}
							disabled={loading}
						/>
					</div>

					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-zinc-700"
						>
							Description
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							maxLength={500}
							disabled={loading}
						/>
					</div>

					{type === "requestedPeriod" && (
						<div>
							<label
								htmlFor="endDate"
								className="block text-sm font-medium text-zinc-700"
							>
								End Date (Optional)
							</label>
							<input
								type="date"
								id="endDate"
								value={endDate}
								min={format(date, "yyyy-MM-dd")}
								max={format(
									new Date(
										date.getTime() + 6 * 24 * 60 * 60 * 1000
									),
									"yyyy-MM-dd"
								)}
								onChange={(e) => setEndDate(e.target.value)}
								className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								disabled={loading}
							/>
						</div>
					)}

					<div className="flex justify-end space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-50"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
							disabled={loading}
						>
							{loading ? "Saving..." : "Save"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}