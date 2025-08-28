import { format, getMonth, getDay } from "date-fns";
import { getWeekNumber } from "../../../utils/dateUtils";
import { X, Download } from "lucide-react";
import { updateAvailabilityException } from "../../../lib/api/users";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "../../../context/TranslationContext";
import { useHolidays, isPublicHoliday } from "../../../context/HolidayContext";
import toast from "react-hot-toast";
import { userSettingsEmitter } from "../../../hooks/useColleagueSettings";
import { useState, useEffect, useRef } from "react";
import { User } from "../../../types";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AvailabilityReportProps {
	data: {
		year: string;
		userId: string;
		workWeekDays: string[];
		dayParts: string[];
		availability: {
			[key: string]: {
				am: boolean;
				pm: boolean;
			};
		};
	};
	colleague: User;
	onClose: () => void;
}

export function AvailabilityReport({ data, colleague, onClose }: AvailabilityReportProps) {
	const { token } = useAuth();
	const { t } = useTranslation();
	const { holidays, loadHolidays } = useHolidays();

	// Use translated day headers
	const dayHeaders = [
		t('days.mon'),
		t('days.tue'),
		t('days.wed'),
		t('days.thu'),
		t('days.fri'),
		t('days.sat'),
		t('days.sun')
	];

	// Use translated month names
	const months = [
		t('months.january'),
		t('months.february'),
		t('months.march'),
		t('months.april'),
		t('months.may'),
		t('months.june'),
		t('months.july'),
		t('months.august'),
		t('months.september'),
		t('months.october'),
		t('months.november'),
		t('months.december'),
	];

	// Track both clicked slots and their current values
	const [slotStates, setSlotStates] = useState<Record<string, boolean>>({});
	const [loadingSlots, setLoadingSlots] = useState<Record<string, boolean>>(
		{}
	);
	const [isExporting, setIsExporting] = useState(false);
	const reportRef = useRef<HTMLDivElement>(null);

	// Load holidays for the report year
	useEffect(() => {
		const year = parseInt(data.year);
		loadHolidays(year);
	}, [data.year, loadHolidays]);

	// Initialize slot states from data
	useEffect(() => {
		const initialStates: Record<string, boolean> = {};
		Object.entries(data.availability).forEach(([date, dayData]) => {
			["am", "pm"].forEach((part) => {
				const slotKey = `${date}-${part}`;
				initialStates[slotKey] = dayData[part as keyof typeof dayData];
			});
		});
		setSlotStates(initialStates);
	}, [data]);

	const handleTimeSlotClick = async (
		dateStr: string,
		part: "am" | "pm",
		currentValue: boolean
	) => {
		if (!token) return;

		const slotKey = `${dateStr}-${part}`;
		const newValue = !currentValue;

		// Update loading state
		setLoadingSlots((prev) => ({ ...prev, [slotKey]: true }));

		try {
			await updateAvailabilityException(token, data.userId, {
				date: dateStr,
				part,
				value: newValue,
			});

			// Update local state
			setSlotStates((prev) => ({ ...prev, [slotKey]: newValue }));

			// Emit event to update settings
			userSettingsEmitter.emit("availabilityChanged", {
				userId: data.userId,
				type: "exception",
				data: {
					date: dateStr,
					part,
					value: newValue,
				},
			});

			toast.success(t('availability.availabilityUpdated'));
		} catch (error) {
			console.error(t('availability.failedToUpdateAvailability'), error);
			toast.error(t('availability.failedToUpdateAvailability'));
			// Don't update state on error
		} finally {
			setLoadingSlots((prev) => ({ ...prev, [slotKey]: false }));
		}
	};

	const handleExportToPDF = async () => {
		if (!reportRef.current) return;

		setIsExporting(true);
		const toastId = toast.loading(t('export.preparingExport'));

		try {
			// Create a clone of the report for PDF generation
			const reportElement = reportRef.current;
			const canvas = await html2canvas(reportElement, {
				scale: 2,
				useCORS: true,
				allowTaint: true,
				backgroundColor: '#ffffff',
				width: reportElement.scrollWidth,
				height: reportElement.scrollHeight,
			});

			// Create PDF
			const pdf = new jsPDF({
				orientation: 'landscape',
				unit: 'mm',
				format: 'a4'
			});

			const imgData = canvas.toDataURL('image/png');
			const imgWidth = 297; // A4 landscape width in mm
			const pageHeight = 210; // A4 landscape height in mm
			const imgHeight = (canvas.height * imgWidth) / canvas.width;
			let heightLeft = imgHeight;
			let position = 0;

			// Add first page
			pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
			heightLeft -= pageHeight;

			// Add additional pages if needed
			while (heightLeft >= 0) {
				position = heightLeft - imgHeight;
				pdf.addPage();
				pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
				heightLeft -= pageHeight;
			}

			// Generate filename
			const filename = `availability-report-${colleague.firstName}-${colleague.lastName}-${data.year}.pdf`;
			
			// Save the PDF
			pdf.save(filename);

			toast.success(t('export.exportDownloaded'), { id: toastId });
		} catch (error) {
			console.error('Failed to export PDF:', error);
			toast.error(t('export.failedToExport'), { id: toastId });
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
			data-tsx-id="availability-report"
		>
			<div className="bg-white rounded-lg shadow-xl max-w-[1400px] w-full max-h-[90vh] overflow-auto" ref={reportRef}>
				<div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b">
					<div className="flex items-center space-x-4">
						<h2 className="text-xl font-semibold text-zinc-900">
							{t('availability.availabilityReportFor', {
								name: `${colleague.firstName} ${colleague.lastName}`,
								year: data.year
							})}
						</h2>
					</div>
					<div className="flex items-center space-x-2">
						<button
							onClick={handleExportToPDF}
							disabled={isExporting}
							className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							title={t('export.exportToPDF')}
						>
							{isExporting ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									{t('export.exporting')}
								</>
							) : (
								<>
									<Download className="w-4 h-4 mr-2" />
									{t('export.exportToPDF')}
								</>
							)}
						</button>
						<button
							onClick={onClose}
							className="text-zinc-400 hover:text-zinc-500"
						>
							<X className="w-6 h-6" />
						</button>
					</div>
				</div>

				<div className="p-6">
					<div className="w-full">
						{/* Header row with day names */}
						<div className="grid grid-cols-[100px_repeat(37,1fr)] border-b">
							<div className="p-2"></div>
							{[...Array(5)].map((_, weekIndex) =>
								dayHeaders.map((day, i) => (
									<div
										key={`header-${weekIndex}-${i}`}
										className="text-center font-medium p-2 text-xs"
									>
										{day}
									</div>
								))
							)}
						</div>

						{/* Month rows */}
						{months.map((monthName, monthIndex) => {
							const firstDayOfMonth = new Date(
								parseInt(data.year),
								monthIndex,
								1
							);
							const adjustedWeekday =
								getMondayBasedDay(firstDayOfMonth);

							return (
								<div
									key={monthName}
									className="grid grid-cols-[100px_repeat(37,1fr)] border-b"
								>
									<div className="p-2 font-medium">
										{monthName}
									</div>
									{Array(37)
										.fill(0)
										.map((_, index) => {
											const dayOffset =
												index - adjustedWeekday;
											const currentDate = new Date(
												firstDayOfMonth
											);
											currentDate.setDate(1 + dayOffset);

											if (
												getMonth(currentDate) !==
												monthIndex
											) {
												return (
													<div
														key={index}
														className="p-2"
													/>
												);
											}

											const dateStr = format(
												currentDate,
												"yyyy-MM-dd"
											);
											const dayData =
												data.availability[dateStr];
											const dayOfWeek =
												getMondayBasedDay(currentDate);
											const isWeekend = dayOfWeek >= 5; // 5=Sat, 6=Sun
											const isHoliday = isPublicHoliday(currentDate, holidays);
											const weekNumber =
												getWeekNumber(currentDate);
											const isEvenWeek =
												weekNumber % 2 === 0;

											// Determine background color based on day type
											let bgColor = '';
											if (isHoliday) {
												bgColor = 'bg-red-50'; // Holiday background
											} else if (isEvenWeek) {
												if (isWeekend) {
													bgColor = 'bg-zinc-100'; // Even week background
												} else {
													bgColor = 'bg-zinc-50'; // Regular day background
												}
											} else if (!isEvenWeek) {
												if (isWeekend) {
													bgColor = 'bg-zinc-200'; // Even week background
												} else {
													bgColor = 'bg-zinc-100'; // Regular day background
												}
											}

											return (
												<div
													key={index}
													className={`p-1 border-r border-zinc-100 ${bgColor}`}
													title={format(
														currentDate,
														"MMMM d, yyyy"
													)}
												>
													<div className="text-xs text-center">
														{format(
															currentDate,
															"d"
														)}
													</div>
													<div className="space-y-0.5 mt-1">
														{data.dayParts.map(
															(part) => {
																const slotKey = `${dateStr}-${part}`;
																const isLoading =
																	loadingSlots[
																	slotKey
																	];
																const currentValue =
																	slotStates[
																	slotKey
																	] ??
																	dayData?.[
																	part as keyof typeof dayData
																	] ??
																	false;

																return (
																	<button
																		key={
																			part
																		}
																		onClick={() =>
																			handleTimeSlotClick(
																				dateStr,
																				part as
																				| "am"
																				| "pm",
																				currentValue
																			)
																		}
																		className={`h-1.5 w-full transition-colors cursor-pointer ${isLoading
																			? "bg-yellow-500"
																			: currentValue
																				? "bg-green-500 hover:bg-green-600"
																				: isWeekend
																					? "bg-zinc-300"
																					: isHoliday
																						? "bg-red-300"
																						: "bg-red-500 hover:bg-red-600"
																			} rounded-sm`}
																		disabled={
																			isWeekend ||
																			isHoliday ||
																			isLoading
																		}
																		title={`${format(currentDate, "MMM d")} ${part.toUpperCase()}`}
																	/>
																);
															}
														)}
													</div>
												</div>
											);
										})}
								</div>
							);
						})}
					</div>

					{/* Legend */}
					<div className="mt-6 space-y-4">
						<div className="flex items-center space-x-6 text-sm">
							<div className="flex items-center space-x-2">
								<div className="w-4 h-4 bg-green-500 rounded" />
								<span>{t('calendar.available')}</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className="w-4 h-4 bg-red-500 rounded" />
								<span>{t('calendar.unavailable')}</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className="w-4 h-4 bg-zinc-300 rounded" />
								<span>{t('calendar.weekend')}</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className="w-4 h-4 bg-red-50 rounded border border-red-300" />
								<span>{t('calendar.holiday')}</span>
							</div>
						</div>
						<div className="text-sm text-zinc-600">
							{t('availability.clickToToggle')}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Helper to convert Sunday=0 to Monday=0
const getMondayBasedDay = (date: Date): number => {
	const day = getDay(date);
	return day === 0 ? 6 : day - 1;
};