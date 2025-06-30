import { useState, useEffect, useRef } from "react";
import { X, FileText, Plus, Scissors } from "lucide-react";
import { User } from "../../../types/user";
import { useAuth } from "../../../context/AuthContext";
import { updateUserAvailabilitySchedule } from "../../../lib/api";
import { getAvailabilityReport } from "../../../lib/api/report";
import { AvailabilityReport } from "./AvailabilityReport";
import { useAvailabilityState } from "./hooks/useAvailabilityState";
import { useAvailabilityNavigation } from "./hooks/useAvailabilityNavigation";
import { useScheduleNavigation } from "./hooks/useScheduleNavigation";
import { NavigationControls } from "./components/NavigationControls";
import { ScheduleGrid } from "./components/ScheduleGrid";
import { Availability, WeeklySchedule } from "../../../lib/api/types";
import { TimeSlot } from "../../../../src/types/availability";
import { SplitScheduleModal } from "./components/SplitScheduleModal";
import toast from "react-hot-toast";
import { userSettingsEmitter } from "../../../hooks/useColleagueSettings";
import { useApp } from "../../../context/AppContext";
import { useTranslation } from "../../../context/TranslationContext";

interface AvailabilityModalProps {
	colleague: User;
	onClose: () => void;
}

export function AvailabilityModal({
	colleague,
	onClose,
}: AvailabilityModalProps) {
	const { t } = useTranslation();
	const { token } = useAuth();
	const { currentUser, colleagues } = useApp();
	if (!token || !currentUser) return null;

	const [showReport, setShowReport] = useState(false);
	const [reportData, setReportData] = useState<any>(null);
	const [reportYear, setReportYear] = useState(
		new Date().getFullYear().toString()
	);
	const [showSplitModal, setShowSplitModal] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [selectedColleague, setSelectedColleague] = useState<User>(colleague);
	const isAdmin = currentUser?.role === 'admin';
	const isReadOnly = !isAdmin && currentUser?.id !== colleague.id;

	// Refs for input elements to maintain focus
	const startDateRef = useRef<HTMLInputElement>(null);
	const endDateRef = useRef<HTMLInputElement>(null);
	const repeatPatternRef = useRef<HTMLSelectElement>(null);

	const {
		loading,
		setLoading,
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
	} = useAvailabilityState(selectedColleague);

	const {
		currentEntryIndex,
		totalEntries,
		handleFirstEntry,
		handlePrevEntry,
		handleNextEntry,
		handleLastEntry,
	} = useAvailabilityNavigation({
		colleague: selectedColleague,
		setStartDate,
		setEndDate,
		setRepeatPattern,
		setSchedule,
		setAlternateSchedule,
	});

	const { handleAdd, handleSplit } = useScheduleNavigation({
		token,
		colleague: selectedColleague,
		currentEntryIndex,
		setCurrentEntryIndex: () => { },
		setStartDate,
		setEndDate,
		setSchedule,
		setAlternateSchedule,
		setError,
	});

	// Update selected colleague when colleague prop changes
	useEffect(() => {
		setSelectedColleague(colleague);
	}, [colleague]);

	const handleViewReport = async () => {
		if (!token) return;

		const toastId = toast.loading(t('availability.loadingReport'));
		try {
			setLoading(true);
			setError("");
			const data = await getAvailabilityReport(
				token,
				selectedColleague.site,
				selectedColleague.id,
				reportYear
			);
			setReportData(data);
			setShowReport(true);
			toast.success(t('availability.reportLoadedSuccess'), { id: toastId });
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: t('availability.errors.fetchReportFailed');
			setError(errorMessage);
			toast.error(errorMessage, { id: toastId });
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!token || currentEntryIndex === -1 || isReadOnly) return;

		const toastId = toast.loading(t('availability.savingChanges'));
		try {
			setLoading(true);
			setError("");

			const availability: Availability = {
				weeklySchedule: schedule,
				...(repeatPattern === "evenodd" && {
					oddWeeklySchedule: alternateSchedule,
				}),
				startDate,
				endDate,
				repeatPattern,
			};

			await updateUserAvailabilitySchedule(
				token,
				selectedColleague.id,
				currentEntryIndex,
				availability
			);

			// Emit settings update event
			userSettingsEmitter.emit("settingsUpdated", {
				userId: selectedColleague.id,
				settings: {
					...currentUser.settings,
					availability: [
						...currentUser.settings?.availability?.slice(0, currentEntryIndex) || [],
						availability,
						...currentUser.settings?.availability?.slice(currentEntryIndex + 1) || []
					]
				}
			});

			setHasChanges(true);
			toast.success(t('availability.changesSavedSuccess'), { id: toastId });
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: t('availability.errors.saveFailed');
			setError(errorMessage);
			toast.error(errorMessage, { id: toastId });
		} finally {
			setLoading(false);
		}
	};

	const handleCloseModal = () => {
		if (hasChanges) {
			// Trigger a refresh of the calendar grid
			userSettingsEmitter.emit("availabilityChanged", {
				userId: selectedColleague.id
			});
		}
		onClose();
	};

	const onTimeSlotToggle = (
		day: keyof WeeklySchedule,
		slot: keyof TimeSlot,
		isAlternate: boolean
	) => {
		if (isReadOnly) return;

		handleTimeSlotToggle(
			token,
			selectedColleague.id,
			currentEntryIndex,
			day,
			slot,
			isAlternate
		);
	};

	// Filter colleagues for admin dropdown - exclude admin users
	const filteredColleagues = isAdmin
		? colleagues.filter(c => c.id !== currentUser.id && c.role !== "admin")
		: [];

	const handleColleagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedId = e.target.value;
		const newColleague = filteredColleagues.find(c => c.id === selectedId);
		if (newColleague) {
			setSelectedColleague(newColleague);
		}
	};

	// Handle input changes with focus preservation
	const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setStartDate(e.target.value);
		// No need to manually set focus as the input already has it
	};

	const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEndDate(e.target.value);
		// No need to manually set focus as the input already has it
	};

	const handleRepeatPatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setRepeatPattern(e.target.value as "all" | "evenodd");
		// No need to manually set focus as the select already has it
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
				<div className="flex justify-between items-center p-6 border-b">
					<div className="flex items-center space-x-4">
						<h2 className="text-xl font-semibold text-zinc-900">
							{t('availability.setAvailabilityFor', { firstName: selectedColleague.firstName, lastName: selectedColleague.lastName })}
						</h2>
						{isAdmin && (
							<select
								value={selectedColleague.id}
								onChange={handleColleagueChange}
								className="ml-4 rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							>
								{filteredColleagues.map(c => (
									<option key={c.id} value={c.id}>
										{c.firstName} {c.lastName}{c.id === currentUser.id ? ' (You)' : ''}
									</option>
								))}
							</select>
						)}
					</div>
					<button
						onClick={handleCloseModal}
						className="text-zinc-400 hover:text-zinc-500"
						aria-label={t('common.close')}
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div className="grid grid-cols-12 gap-4 items-end">
						<div className="col-span-2">
							<NavigationControls
								currentEntryIndex={currentEntryIndex}
								totalEntries={totalEntries}
								onFirstEntry={handleFirstEntry}
								onPrevEntry={handlePrevEntry}
								onNextEntry={handleNextEntry}
								onLastEntry={handleLastEntry}
								isNewEntry={currentEntryIndex === -1}
							/>
						</div>

						<div className="col-span-10 grid grid-cols-9 gap-2">
							<div className="p-2 col-span-3 border rounded-md border-zinc-300">
								<label className="block text-sm font-medium text-zinc-700 mb-0">
									{t('common.startDate')}
								</label>
								<div className="flex-1 flex items-center">
									<button
										onClick={() => !isReadOnly && handleAdd(true)}
										className={`space-x-2 ${isReadOnly ? "text-zinc-300 cursor-not-allowed hidden" :
											currentEntryIndex === -1 ||
												currentEntryIndex === 0
												? "text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
												: "text-zinc-300 cursor-not-allowed hidden"
											}`}
										title={t('availability.addScheduleBefore')}
										disabled={isReadOnly}
									>
										<Plus className="w-5 h-5" />
									</button>
									<input
										ref={startDateRef}
										type="date"
										value={startDate}
										onChange={handleStartDateChange}
										className={`w-32 ${currentEntryIndex === -1
											? "opacity-50 cursor-not-allowed hidden"
											: ""
											}`}
										disabled={currentEntryIndex === -1 || isReadOnly}
										readOnly={isReadOnly}
									/>
								</div>
							</div>

							<div className="col-span-1 flex items-end justify-center">
								<button
									onClick={() => setShowSplitModal(true)}
									className={`p-2 text-zinc-600 hover:bg-purple-50 rounded-full transition-colors ${isReadOnly || currentEntryIndex === -1 || !endDate
										? "opacity-50 cursor-not-allowed hidden"
										: ""
										}`}
									title={t('availability.splitSchedule')}
									disabled={
										isReadOnly || currentEntryIndex === -1 || !endDate
									}
								>
									<Scissors className="w-5 h-5" />
								</button>
							</div>

							<div className="p-2 col-span-3 border rounded-md border-zinc-300">
								<label className="block text-sm font-medium text-zinc-700 mb-0">
									{t('common.endDate')}
								</label>
								<div className="flex-1 flex items-center">
									<input
										ref={endDateRef}
										type="date"
										value={endDate}
										onChange={handleEndDateChange}
										min={startDate}
										className={`w-32 ${currentEntryIndex === -1
											? "opacity-50 cursor-not-allowed hidden"
											: ""
											}`}
										disabled={currentEntryIndex === -1 || isReadOnly}
										readOnly={isReadOnly}
									/>
									<button
										onClick={() => !isReadOnly && handleAdd(false)}
										className={`space-x-2 ${isReadOnly ? "text-zinc-300 cursor-not-allowed hidden" :
											currentEntryIndex === -1 ||
												currentEntryIndex ===
												totalEntries - 1
												? "text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
												: "text-zinc-300 cursor-not-allowed hidden"
											}`}
										title={t('availability.addScheduleAfter')}
										disabled={isReadOnly}
									>
										<Plus className="w-5 h-5" />
									</button>
								</div>
							</div>

							<div className="p-2 col-span-2 border rounded-md border-zinc-300">
								<div className="flex justify-end">
									<div className="w-48">
										<label className="block text-sm font-medium text-zinc-700 mb-1">
											{t('availability.repeatPattern')}
										</label>
										<select
											ref={repeatPatternRef}
											value={repeatPattern}
											onChange={handleRepeatPatternChange}
											className={`w-32 rounded-md border-zinc-300 ${currentEntryIndex === -1
												? "opacity-50 cursor-not-allowed hidden"
												: ""
												}`}
											disabled={currentEntryIndex === -1 || isReadOnly}
										>
											<option value="all">
												{t('availability.everyWeek')}
											</option>
											<option value="evenodd">
												{t('availability.alternateWeeks')}
											</option>
										</select>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="space-y-8 h-[348px]">
						{repeatPattern === "evenodd" && (
							<div>
								<ScheduleGrid
									caption={t('availability.evenWeeks')}
									schedule={schedule}
									onTimeSlotToggle={onTimeSlotToggle}
									disabled={currentEntryIndex === -1 || isReadOnly}
								/>
							</div>
						)}

						<div>
							<ScheduleGrid
								caption={
									repeatPattern === "all"
										? t('availability.weeklySchedule')
										: t('availability.oddWeeks')
								}
								schedule={
									repeatPattern === "evenodd"
										? alternateSchedule
										: schedule
								}
								isAlternate={repeatPattern === "evenodd"}
								onTimeSlotToggle={onTimeSlotToggle}
								disabled={currentEntryIndex === -1 || isReadOnly}
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
							{t('availability.viewReport')}
						</button>
					</div>

					<div className="flex space-x-3">
						<button
							onClick={handleCloseModal}
							className="flex items-center px-4 py-2 w-32 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
							disabled={loading}
						>
							<X className="w-4 h-4 mr-2" />
							{t('common.cancel')}
						</button>
						<button
							onClick={handleSave}
							disabled={loading || currentEntryIndex === -1 || isReadOnly}
							className={`flex items-center px-4 py-2 w-32 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600`}
						>
							{loading ? (
								<span className="flex items-center">
									<svg
										className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									{t('common.saving')}
								</span>
							) : (
								t('common.save')
							)}
						</button>
					</div>
				</div>
			</div>

			{showReport && reportData && (
				<AvailabilityReport
					data={reportData}
					colleague={selectedColleague}
					onClose={() => setShowReport(false)}
				/>
			)}

			{showSplitModal && currentEntryIndex !== -1 && (
				<SplitScheduleModal
					startDate={startDate}
					endDate={endDate}
					onSplit={handleSplit}
					onClose={() => setShowSplitModal(false)}
				/>
			)}
		</div>
	);
}