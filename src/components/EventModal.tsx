import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, User } from "lucide-react";
import { Event } from "../types/event";
import { Period } from "../types/period";
import { getAllowedEventTypeForRange } from "../utils/periodUtils";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { getPeriods } from "../lib/api/periods";
import { useTranslation } from "../context/TranslationContext";
import toast from "react-hot-toast";

interface EventModalProps {
	date: Date;
	endDate: Date | null;
	event?: Event;
	onClose: () => void;
	onSubmit: (data: {
		title: string;
		description: string;
		date: string;
		endDate?: string;
		type: string;
		userId?: string; // Added userId for admin event creation
		amSelected?: boolean; // Added for AM selection
		pmSelected?: boolean; // Added for PM selection
	}) => Promise<void>;
	defaultEventType?: string;
}

export function EventModal({
	date,
	endDate,
	event,
	onClose,
	onSubmit,
	defaultEventType,
}: EventModalProps) {
	const { token } = useAuth();
	const { currentUser, colleagues } = useApp();
	const { t } = useTranslation();
	const [title, setTitle] = useState(event?.title || "");
	const [description, setDescription] = useState(event?.description || "");
	const [type, setType] = useState(
		event?.type || defaultEventType || "requestedLeave"
	);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [periods, setPeriods] = useState<Period[]>([]);
	const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);
	const [selectedColleagueId, setSelectedColleagueId] = useState<string>("");
	const [amSelected, setAmSelected] = useState<boolean>(true);
	const [pmSelected, setPmSelected] = useState<boolean>(true);

	// Check if this is a single day event (same start and end date)
	const isSingleDayEvent = !endDate || date.getTime() === endDate.getTime();

	// Check if this is a holiday type event
	const isHolidayType = type === "requestedLeave" || type === "requestedLeaveMandatory";

	// Show AM/PM selection only for single day holiday events
	const showAmPmSelection = isSingleDayEvent && isHolidayType;

	// Check if user is admin
	const isAdmin = currentUser?.role === "admin";

	// Load periods and determine available event types
	useEffect(() => {
		const loadPeriodsAndDetermineTypes = async () => {
			if (!token || !currentUser) return;

			try {
				const year = date.getFullYear();
				const data = await getPeriods(token, currentUser.site, year);
				setPeriods(data.periods || []);

				// Determine available event types based on periods
				const dateStr = format(date, "yyyy-MM-dd");
				const availableTypes = getAvailableEventTypes(dateStr, data.periods || []);
				setAvailableEventTypes(availableTypes);

				// Set default type if current type is not available
				if (availableTypes.length > 0 && !availableTypes.includes(type)) {
					setType(availableTypes[0]);
				}
			} catch (error) {
				console.error("Failed to load periods:", error);
				// Fallback to basic event types if periods can't be loaded
				setAvailableEventTypes(["requestedLeave"]);
			}
		};

		loadPeriodsAndDetermineTypes();
	}, [token, currentUser, date, type]);

	// Set current user as default selected colleague for admin
	useEffect(() => {
		if (isAdmin && currentUser) {
			setSelectedColleagueId(currentUser.id);
		}
	}, [isAdmin, currentUser]);

	const getAvailableEventTypes = (dateStr: string, periods: Period[]): string[] => {
		// Admin can always create any event type
		if (isAdmin) {
			return ["requestedLeave", "requestedDesiderata"];
		}

		// For regular users, check period-based restrictions
		const allowedType = getAllowedEventTypeForRange(dateStr, endDate || dateStr, periods);

		if (!allowedType) {
			// No event type allowed (closed or undefined period)
			return [];
		}

		return [allowedType];
	};

	const getEventTypeLabel = (eventType: string): string => {
		switch (eventType) {
			case "requestedLeave":
				return t('calendar.requestedLeave');
			case "requestedDesiderata":
				return t('calendar.requestedDesiderata');
			default:
				return eventType
					.replace(/([A-Z])/g, " $1")
					.replace(/^./, (str) => str.toUpperCase());
		}
	};

	const getCurrentPeriodStatus = (): string => {
		const dateStr = format(date, "yyyy-MM-dd");
		const targetDate = new Date(dateStr);

		const currentPeriod = periods.find(period => {
			const periodStart = new Date(period.startDate);
			const periodEnd = new Date(period.endDate);
			return targetDate >= periodStart && targetDate <= periodEnd;
		});

		if (!currentPeriod) {
			return t('events.unknownStatus', { period: '' });
		}

		switch (currentPeriod.editingStatus) {
			case 'open-holiday':
				return t('events.holidayRequestsOpen', { period: currentPeriod.name });
			case 'open-desiderata':
				return t('events.holidayDesiderataOpen', { period: currentPeriod.name });
			case 'closed':
				return t('events.periodClosed', { period: currentPeriod.name });
			default:
				return t('events.unknownStatus', { period: currentPeriod.name });
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Check if any event types are available
		if (availableEventTypes.length === 0) {
			setError(t('events.noEventTypesAvailable'));
			return;
		}

		// Validate that the selected type is available
		if (!availableEventTypes.includes(type)) {
			setError(t('events.noEventTypesAvailable'));
			return;
		}

		// For admin users, validate colleague selection
		if (isAdmin && !selectedColleagueId) {
			setError(t('users.selectColleague'));
			return;
		}

		// For single day holiday events, validate that at least one time slot is selected
		if (showAmPmSelection && !amSelected && !pmSelected) {
			setError(t('events.selectAtLeastOneTimeSlot'));
			return;
		}

		const toastId = toast.loading(t('events.saving'));

		try {
			setLoading(true);
			setError("");

			const eventData = {
				title: title.trim(),
				description: description.trim(),
				date: format(date, "yyyy-MM-dd"),
				endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
				type,
				...(isAdmin && { userId: selectedColleagueId }), // Include userId only for admin users
				...(showAmPmSelection && { amSelected, pmSelected }), // Include AM/PM selection for single day holiday events
			};

			await onSubmit(eventData);
			toast.success(t('calendar.eventCreated'), { id: toastId });
			onClose();
		} catch (err) {
			toast.error(t('calendar.failedToCreateEvent'), { id: toastId });
			setError(
				err instanceof Error ? err.message : t('errors.somethingWentWrong')
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
				<div className="flex justify-between items-center p-4 border-b">
					<h3 className="text-lg font-semibold text-zinc-900">
						{event ? t('calendar.editEvent') : t('calendar.addEvent')} -{" "}
						{format(date, "MMMM d, yyyy")}
						{endDate && endDate.getTime() !== date.getTime() && ` to ${format(endDate, "MMMM d, yyyy")}`}
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

					{/* Admin-only colleague selection */}
					{isAdmin && (
						<div>
							<label htmlFor="colleague" className="block text-sm font-medium text-zinc-700 mb-1">
								{t('users.selectColleague')} *
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<User className="h-5 w-5 text-zinc-400" />
								</div>
								<select
									id="colleague"
									value={selectedColleagueId}
									onChange={(e) => setSelectedColleagueId(e.target.value)}
									className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
									required
									aria-required="true"
								>
									<option value="">{t('users.selectColleague')}</option>
									{colleagues.map((colleague) => (
										<option key={colleague.id} value={colleague.id}>
											{colleague.firstName} {colleague.lastName}
										</option>
									))}
									{currentUser && (
										<option value={currentUser.id}>
											{currentUser.firstName} {currentUser.lastName} (You)
										</option>
									)}
								</select>
							</div>
						</div>
					)}

					{availableEventTypes.length === 0 ? (
						<div className="p-3 text-sm text-amber-700 bg-amber-50 rounded-md border border-amber-200">
							<div className="font-medium mb-1">{t('events.noEventTypesAvailable')}</div>
							<div>{t('events.periodClosedMessage')}</div>
						</div>
					) : (
						<>
							<div>
								<label className="block text-sm font-medium text-zinc-700">
									{t('events.eventType')} *
								</label>
								<select
									value={type}
									onChange={(e) => setType(e.target.value)}
									className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									disabled={loading || availableEventTypes.length <= 1}
								>
									{availableEventTypes.map((eventType) => (
										<option key={eventType} value={eventType}>
											{getEventTypeLabel(eventType)}
										</option>
									))}
								</select>
								{availableEventTypes.length > 1 && (
									<p className="mt-1 text-xs text-zinc-500">
										{t('events.cascadedSystem')}
									</p>
								)}
							</div>

							{/* AM/PM Selection for single day holiday events */}
							{showAmPmSelection && (
								<>
									<label className="block text-sm font-medium text-zinc-700 mb-2">
										{t('availability.timeSlots')}
									</label>
									<div className="flex space-x-4">
										<label className="inline-flex items-center">
											<input
												type="checkbox"
												checked={amSelected}
												onChange={(e) => setAmSelected(e.target.checked)}
												className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
											/>
											<span className="ml-2 text-sm text-zinc-700">{t('availability.morning')}</span>
										</label>
										<label className="inline-flex items-center">
											<input
												type="checkbox"
												checked={pmSelected}
												onChange={(e) => setPmSelected(e.target.checked)}
												className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
											/>
											<span className="ml-2 text-sm text-zinc-700">{t('availability.afternoon')}</span>
										</label>
									</div>
									{!amSelected && !pmSelected && (
										<p className="mt-2 text-xs text-red-600">
											{t('events.selectAtLeastOneTimeSlot')}
										</p>
									)}
								</>
							)}

							<div>
								<label
									htmlFor="title"
									className="block text-sm font-medium text-zinc-700"
								>
									{t('events.title')}
								</label>
								<input
									type="text"
									id="title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									maxLength={100}
									disabled={loading}
									placeholder={t('events.enterTitle', { type: getEventTypeLabel(type).toLowerCase() })}
								/>
							</div>

							<div>
								<label
									htmlFor="description"
									className="block text-sm font-medium text-zinc-700"
								>
									{t('events.description')}
								</label>
								<textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={3}
									className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									maxLength={500}
									disabled={loading}
									placeholder={t('events.enterDescription', { type: getEventTypeLabel(type).toLowerCase() })}
								/>
							</div>
						</>
					)}

					<div className="flex justify-end space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-50"
							disabled={loading}
						>
							{t('common.cancel')}
						</button>
						{availableEventTypes.length > 0 && (
							<button
								type="submit"
								className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
								disabled={loading || (showAmPmSelection && !amSelected && !pmSelected)}
							>
								{loading ? t('events.saving') : t('common.save')}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}