import { Router } from "express";
import { readSiteData } from "../utils.js";
import { eachDayOfInterval, format, parseISO, startOfWeek, endOfWeek, getDay, eachWeekOfInterval } from "date-fns";
import { authenticateToken } from "../middleware/auth.js";
import { getWeekNumber } from "../utils/dateUtils.js";
import { readUserSettings } from "../utils.js";

interface TimeSlot {
    am?: boolean;
    pm?: boolean;
}

interface WeeklySchedule {
    Monday?: TimeSlot;
    Tuesday?: TimeSlot;
    Wednesday?: TimeSlot;
    Thursday?: TimeSlot;
    Friday?: TimeSlot;
    Saturday?: TimeSlot;
    Sunday?: TimeSlot;
}

interface AvailabilitySettings {
    startDate: string;
    endDate?: string;
    repeatPattern: string;
    weeklySchedule: WeeklySchedule;
    oddWeeklySchedule?: WeeklySchedule;
}

interface AvailabilityException {
    date: string;
    am?: boolean;
    pm?: boolean;
}

interface DailyAvailability {
    am: boolean;
    pm: boolean;
}

interface AvailabilityAccumulator {
    [key: string]: DailyAvailability;
}

const dayMap: Record<number, keyof WeeklySchedule> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
};

const router = Router();

router.use(authenticateToken);

router.get("/calendar/:site/:userId/:year", async (req, res) => {
	try {
		const { site, userId, year } = req.params;

		if (!site || !userId || !year) {
			return res.status(400).json({
				error: "Missing required parameters"
			});
		}

		const yearNum = parseInt(year, 10);
		if (isNaN(yearNum) || yearNum < 1900 || yearNum > 9999) {
			return res.status(400).json({
				error: "Invalid year format"
			});
		}

		const { startDate, endDate } = req.query;

		const siteData = await readSiteData(site);

		const user = siteData.users.find((u: any) => u.id === userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const weekStartsOn = siteData.app.weekStartsOn || "Sunday";

		const workWeekDays = siteData.app.workWeekDays || [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
		];
		const dayParts = siteData.app.dayParts || ["am", "pm"];

		const settings = await readUserSettings(site, user.id);

		const availabilityArray = settings.availability || [];
		const availabilityExceptions = settings.availabilityExceptions || [];

		const yearStart = new Date(parseInt(year), 0, 1);
		const yearEnd = new Date(parseInt(year), 11, 31);

		let rangeStart = yearStart;
		let rangeEnd = yearEnd;

		if (startDate) {
			const parsedStartDate = parseISO(startDate as string);
			if (parsedStartDate >= yearStart && parsedStartDate <= yearEnd) {
				rangeStart = parsedStartDate;
			}
		}

		if (endDate) {
			const parsedEndDate = parseISO(endDate as string);
			if (parsedEndDate >= yearStart && parsedEndDate <= yearEnd) {
				rangeEnd = parsedEndDate;
			}
		}

		const weekStartDayIndex = getWeekStartDayIndex(weekStartsOn);
		const weeks = eachWeekOfInterval(
			{ start: rangeStart, end: rangeEnd },
			{ weekStartsOn: weekStartDayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6 }
		);

		const calendarWeeks = weeks.map((weekStart) => {
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: weekStartDayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
			const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
			const weekNumber = getWeekNumber(weekStart);

			const dayData = days.map((date) => {
				const dateStr = format(date, "yyyy-MM-dd");
				const dayName = dayMap[getDay(date)] as keyof WeeklySchedule;

				const exception = availabilityExceptions.find(
					(ex) => ex.date === dateStr
				);

				let availability: DailyAvailability;

				if (exception) {
					availability = {
						am: exception.am !== undefined
							? exception.am
							: getDefaultAvailability(date, "am", availabilityArray),
						pm: exception.pm !== undefined
							? exception.pm
							: getDefaultAvailability(date, "pm", availabilityArray),
					};
				} else {
					const setting = availabilityArray
						.filter((a) => {
							const start = parseISO(a.startDate);
							const end = a.endDate
								? parseISO(a.endDate)
								: new Date(2100, 0, 1);
							return date >= start && date <= end;
						})
						.pop();

					if (!setting) {
						availability = { am: false, pm: false };
					} else {
						if (
							setting.repeatPattern === "evenodd" &&
							setting.oddWeeklySchedule
						) {
							const weekNum = getWeekNumber(date);
							const schedule =
								weekNum % 2 === 0
									? setting.weeklySchedule
									: setting.oddWeeklySchedule;
							const timeSlot = schedule[dayName];
							availability = {
								am: timeSlot?.am ?? false,
								pm: timeSlot?.pm ?? false
							};
						} else {
							const timeSlot = setting.weeklySchedule[dayName];
							availability = {
								am: timeSlot?.am ?? false,
								pm: timeSlot?.pm ?? false
							};
						}
					}
				}

				return {
					date: dateStr,
					day: date.getDate(),
					month: date.getMonth() + 1,
					year: date.getFullYear(),
					dayOfWeek: dayName,
					availability
				};
			});

			return {
				weekNumber,
				days: dayData
			};
		});

		res.json({
			year,
			userId,
			userName: `${user.firstName} ${user.lastName}`,
			weekStartsOn,
			workWeekDays,
			dayParts,
			weeks: calendarWeeks,
			dateRange: {
				start: format(rangeStart, "yyyy-MM-dd"),
				end: format(rangeEnd, "yyyy-MM-dd")
			}
		});
	} catch (error) {
		console.error("Error generating calendar report:", error);
		res.status(500).json({
			message: "Failed to generate calendar report",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

function getWeekStartDayIndex(weekStartsOn: string): number {
	const dayIndexMap: Record<string, number> = {
		"Sunday": 0,
		"Monday": 1,
		"Tuesday": 2,
		"Wednesday": 3,
		"Thursday": 4,
		"Friday": 5,
		"Saturday": 6,
	};
	return dayIndexMap[weekStartsOn] || 0;
}

function getDefaultAvailability(
	date: Date,
	part: "am" | "pm",
	availabilityArray: AvailabilitySettings[]
): boolean {
	const dayName = dayMap[getDay(date)];
	const setting = availabilityArray
		.filter((a) => {
			const start = parseISO(a.startDate);
			const end = a.endDate
				? parseISO(a.endDate)
				: new Date(2100, 0, 1);
			return date >= start && date <= end;
		})
		.pop();

	if (!setting) return false;

	if (
		setting.repeatPattern === "evenodd" &&
		setting.oddWeeklySchedule
	) {
		const weekNumber = getWeekNumber(date);
		const schedule =
			weekNumber % 2 === 0
				? setting.weeklySchedule
				: setting.oddWeeklySchedule;
		return schedule[dayName as keyof WeeklySchedule]?.[part] ?? false;
	}

	return setting.weeklySchedule[dayName as keyof WeeklySchedule]?.[part] ?? false;
}

export { router as calendarReportRouter };
