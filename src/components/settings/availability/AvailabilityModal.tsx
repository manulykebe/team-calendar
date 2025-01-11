import { useState } from "react";
import { X, FileText } from "lucide-react";
import { User } from "../../../types/user";
import { useAuth } from "../../../context/AuthContext";
import { updateUserAvailabilitySchedule } from "../../../lib/api";
import { getAvailabilityReport } from "../../../lib/api/report";
import { AvailabilityReport } from "./AvailabilityReport";
import { useAvailabilityState } from "./hooks/useAvailabilityState";
import { useAvailabilityNavigation } from "./hooks/useAvailabilityNavigation";
import { useScheduleNavigation } from "./hooks/useScheduleNavigation";
import { NavigationControls } from "./components/NavigationControls";
import { ScheduleNavigationControls } from "./components/ScheduleNavigationControls";
import { ScheduleGrid } from "./components/ScheduleGrid";
import { Availability } from "../../../lib/api/types";

interface AvailabilityModalProps {
	colleague: User;
	onClose: () => void;
}

export function AvailabilityModal({
	colleague,
	onClose,
}: AvailabilityModalProps) {
	const { token } = useAuth();
	if (!token) return null;
	const [showReport, setShowReport] = useState(false);
	const [reportData, setReportData] = useState<any>(null);
	const [reportYear, setReportYear] = useState(
		new Date().getFullYear().toString()
	);

	const {
		loading,
		setLoading,
		error,
		setError,
		startDate,
		setStartDate,
		endDate,
		setEndDate,
		repeatPattern,
		setRepeatPattern,
		schedule,
		setSchedule,
		alternateSchedule,
		setAlternateSchedule,
		handleTimeSlotToggle,
	} = useAvailabilityState(colleague);

	const {
		currentEntryIndex,
		totalEntries,
		handlePrevEntry,
		handleNextEntry,
	} = useAvailabilityNavigation({
		colleague,
		setStartDate,
		setEndDate,
		setRepeatPattern,
		setSchedule,
		setAlternateSchedule,
	});


	const { handleDelete, handleAdd, handleSplit } = useScheduleNavigation({
		token,
		colleague,
		currentEntryIndex,
		setCurrentEntryIndex: () => {},
		setStartDate,
		setEndDate,
		setSchedule,
		setAlternateSchedule,
		setError,
	});

	const handleSave = async () => {
		if (!token || currentEntryIndex === -1) return;

		try {
			setLoading(true);
			setError("");

			const availability: Availability = {
				weeklySchedule: schedule,
				...(repeatPattern === "evenodd" && {
					alternateWeekSchedule: alternateSchedule,
				}),
				startDate,
				endDate,
				repeatPattern,
			};

			await updateUserAvailabilitySchedule(token, colleague.id, 
				 currentEntryIndex,
				 availability
			);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to save availability"
			);
		} finally {
			setLoading(false);
		}
	};

	const handleViewReport = async () => {
		if (!token) return;

		try {
			setLoading(true);
			setError("");
			const data = await getAvailabilityReport(
				token,
				colleague.site,
				colleague.id,
				reportYear
			);
			setReportData(data);
			setShowReport(true);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to fetch availability report"
			);
		} finally {
			setLoading(false);
		}
	};

	const isNewEntry = currentEntryIndex === -1;

	return (
		<>
			<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
					<div className="flex justify-between items-center p-6 border-b">
						<h2 className="text-xl font-semibold text-zinc-900">
							Set Availability for {colleague.firstName}{" "}
							{colleague.lastName}
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

						<div className="grid grid-cols-12 gap-4 items-end">
							<div className="col-span-2">
								<NavigationControls
									currentEntryIndex={currentEntryIndex}
									totalEntries={totalEntries}
									onPrevEntry={handlePrevEntry}
									onNextEntry={handleNextEntry}
								/>
							</div>

							<div className="col-span-2">
								<ScheduleNavigationControls
									currentEntryIndex={currentEntryIndex}
									totalEntries={totalEntries}
									startDate={startDate}
									endDate={endDate}
									onDelete={handleDelete}
									onAdd={handleAdd}
									onSplit={handleSplit}
									disabled={isNewEntry}
								/>
							</div>

							<div className="col-span-8 grid grid-cols-8 gap-4">
								<div className="col-span-3">
									<label className="block text-sm font-medium text-zinc-700 mb-2">
										Start Date
									</label>
									<input
										type="date"
										value={startDate}
										onChange={(e) =>
											setStartDate(e.target.value)
										}
										className={`w-full rounded-md border-zinc-300 ${
											isNewEntry
												? "opacity-50 cursor-not-allowed"
												: ""
										}`}
										disabled={isNewEntry}
									/>
								</div>
								<div className="col-span-3">
									<label className="block text-sm font-medium text-zinc-700 mb-2">
										End Date
									</label>
									<input
										type="date"
										value={endDate}
										onChange={(e) =>
											setEndDate(e.target.value)
										}
										min={startDate}
										className={`w-full rounded-md border-zinc-300 ${
											isNewEntry
												? "opacity-50 cursor-not-allowed"
												: ""
										}`}
										disabled={isNewEntry}
									/>
								</div>
								<div className="col-span-2">
									<label className="block text-sm font-medium text-zinc-700 mb-2">
										Repeat Pattern
									</label>
									<select
										value={repeatPattern}
										onChange={(e) =>
											setRepeatPattern(
												e.target.value as
													| "all"
													| "evenodd"
											)
										}
										className={`w-full rounded-md border-zinc-300 ${
											isNewEntry
												? "opacity-50 cursor-not-allowed"
												: ""
										}`}
										disabled={isNewEntry}
									>
										<option value="all">All Weeks</option>
										<option value="evenodd">
											Even/Odd Weeks
										</option>
									</select>
								</div>
							</div>
						</div>

            <div className="space-y-8 h-[348px]">
              {repeatPattern === "evenodd" && (
                <div>
                  <ScheduleGrid
                    caption="Even Weeks"
                    schedule={schedule}
                    onTimeSlotToggle={handleTimeSlotToggle}
                    disabled={isNewEntry}
                  />
                </div>
              )}

              <div>
                <ScheduleGrid
                  caption={repeatPattern === "all" ? "Weekly Schedule" : "Odd Weeks"}
                  schedule={repeatPattern === "evenodd" ? alternateSchedule : schedule}
                  isAlternate={repeatPattern === "evenodd"}
                  onTimeSlotToggle={handleTimeSlotToggle}
                  disabled={isNewEntry}
                />
              </div>
            </div>
					</div>

					<div className="flex justify-between space-x-3 p-6 border-t">
						<div className="flex items-center space-x-2">
							<select
								value={reportYear}
								onChange={(e) => setReportYear(e.target.value)}
								className="rounded-md border-zinc-300"
							>
								{[...Array(5)].map((_, i) => {
									const year = new Date().getFullYear() + i;
									return (
										<option key={year} value={year}>
											{year}
										</option>
									);
								})}
							</select>
							<button
								onClick={handleViewReport}
								disabled={loading}
								className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
							>
								<FileText className="w-4 h-4 mr-2" />
								View Report
							</button>
						</div>

						<div className="flex space-x-3">
							<button
								onClick={onClose}
								className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								disabled={loading}
							>
								Cancel
							</button>
							<button
								onClick={handleSave}
								disabled={loading || isNewEntry}
								className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 ${
									isNewEntry
										? "opacity-50 cursor-not-allowed"
										: ""
								}`}
							>
								{loading ? "Saving..." : "Save"}
							</button>
						</div>
					</div>
				</div>
			</div>

			{showReport && reportData && (
				<AvailabilityReport
					data={reportData}
					onClose={() => setShowReport(false)}
				/>
			)}
		</>
	);
}
