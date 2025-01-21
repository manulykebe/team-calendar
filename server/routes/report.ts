import { Router } from "express";
import { readSiteData } from "../utils";
import { eachDayOfInterval, format, parseISO, getDay, isWithinInterval } from "date-fns";
import { authenticateToken } from "../middleware/auth";
import { getWeekNumber } from "../../src/utils/dateUtils";
import { readUserSettings } from "../utils";

const router = Router();

router.use(authenticateToken);

router.get("/availability/:site/:userId/:year", async (req, res) => {
	try {
		const { site, userId, year } = req.params;
		const { startDate, endDate } = req.query;

		const siteData = await readSiteData(site);

		// Find user
		const user = siteData.users.find((u: any) => u.id === userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Get site configuration
		const workWeekDays = siteData.app.workWeekDays || [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
		];
		const dayParts = siteData.app.dayParts || ["am", "pm"];

		// Get availability settings and exceptions
		const settings = await readUserSettings(site, user.id);

		const availabilityArray = settings.availability || [];
		const availabilityExceptions =
		settings.availabilityExceptions || [];

		// Create date range for the year
		const yearStart = new Date(parseInt(year), 0, 1);
		const yearEnd = new Date(parseInt(year), 11, 31);

		// If start/end dates are provided and valid, use them to filter the range
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

		const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

		const dayMap = {
			0: "Sunday",
			1: "Monday",
			2: "Tuesday",
			3: "Wednesday",
			4: "Thursday",
			5: "Friday",
			6: "Saturday",
		};

		// Calculate availability for each day
		const availability = days.reduce((acc, date) => {
			const dateStr = format(date, "yyyy-MM-dd");
			const dayName = dayMap[getDay(date)];

			// Check for exceptions first
			const exception = availabilityExceptions.find(
				(ex) => ex.date === dateStr
			);
			if (exception) {
				acc[dateStr] = {
					am:
						exception.am !== undefined
							? exception.am
							: getDefaultAvailability(date, "am"),
					pm:
						exception.pm !== undefined
							? exception.pm
							: getDefaultAvailability(date, "pm"),
				};
				return acc;
			}

			// Find applicable availability setting
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
				acc[dateStr] = { am: false, pm: false };
				return acc;
			}

			if (
				setting.repeatPattern === "evenodd" &&
				setting.oddWeeklySchedule
			) {
				const weekNumber = getWeekNumber(date);
				const schedule =
					weekNumber % 2 === 0
						? setting.weeklySchedule
						: setting.oddWeeklySchedule;
				acc[dateStr] = schedule[dayName] || { am: false, pm: false };
			} else {
				acc[dateStr] = setting.weeklySchedule[dayName] || {
					am: false,
					pm: false,
				};
			}

			return acc;
		}, {});

		function getDefaultAvailability(
			date: Date,
			part: "am" | "pm"
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
				return schedule[dayName]?.[part] || false;
			}

			return setting.weeklySchedule[dayName]?.[part] || false;
		}

		res.json({
			year,
			userId,
			workWeekDays,
			dayParts,
			availability,
			dateRange: {
				start: format(rangeStart, "yyyy-MM-dd"),
				end: format(rangeEnd, "yyyy-MM-dd")
			}
		});
	} catch (error) {
		console.error("Error generating availability report:", error);
		res.status(500).json({
			message: "Failed to generate availability report",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

export { router as reportRouter };