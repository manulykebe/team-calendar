import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import { readSiteData, readUserEvents } from "../utils.js";
import {
	format,
	parseISO,
	eachDayOfInterval,
	isWithinInterval,
} from "date-fns";

const router = Router();

router.use(authenticateToken);

// Helper function to convert events to CSV
function eventsToCSV(events: any[], users: any[], includeHeaders = true) {
	const headers = [
		"User",
		"Type",
		"Title",
		"Description",
		"Date",
		"Created At",
		"Updated At",
	];

	// Expand events with date ranges into individual dates
	const expandedEvents = events.flatMap((event) => {
		if (!event.endDate || event.date === event.endDate) {
			// Single day event
			return [
				{
					...event,
					expandedDate: event.date,
				},
			];
		}

		// Multi-day event - create an entry for each day in the range
		const dateRange = eachDayOfInterval({
			start: parseISO(event.date),
			end: parseISO(event.endDate),
		});

		return dateRange.map((date) => ({
			...event,
			expandedDate: format(date, "yyyy-MM-dd"),
		}));
	});

	const rows = expandedEvents.map((event) => {
		const user = users.find((u) => u.id === event.userId);
		return [
			user?.initials || "Unknown",
			event.type,
			`"${event.title || ""}"`,
			`"${event.description || ""}"`,
			event.expandedDate,
			event.createdAt,
			event.updatedAt,
		];
	});

	if (includeHeaders) {
		rows.unshift(headers);
	}

	return rows.map((row) => row.join(";")).join("\n");
}

// Export all events for a site
router.get("/:site", async (req: AuthRequest, res) => {
	try {
		const { site } = req.params;
		const { startDate, endDate } = req.query;

		const siteData = await readSiteData(site);
		let users = [...siteData.users];

		let events: any[] = [];
		for (const user of users) {
			const userEvents = await readUserEvents(site, user.id);
			events = [...events, ...userEvents];
		}
		// Filter by date range if provided
		if (startDate && endDate) {
			const start = parseISO(startDate as string);
			const end = parseISO(endDate as string);

			events = events.filter((event) => {
				const eventStart = parseISO(event.date);
				const eventEnd = event.endDate
					? parseISO(event.endDate)
					: eventStart;

				return (
					isWithinInterval(eventStart, { start, end }) ||
					isWithinInterval(eventEnd, { start, end }) ||
					(eventStart <= start && eventEnd >= end)
				);
			});
		}

		const csv = eventsToCSV(events, users);

		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename=events-${site}-${format(new Date(), "yyyy-MM-dd")}.csv`
		);
		res.send(csv);
	} catch (error) {
		console.error("Error exporting events:", error);
		res.status(500).json({ message: "Failed to export events" });
	}
});

// Export events for a specific user
router.get("/:site/:userId", async (req: AuthRequest, res) => {
	try {
		const { site, userId } = req.params;
		const { startDate, endDate } = req.query;
		const siteData = await readSiteData(site);

		let users = [...siteData.users].filter((user) => user.id === userId);
		if (users.length === 0) {
			res.status(500).json({ message: "Failed to export user events" });
		}
		let events = await readUserEvents(site, userId);

		// Filter by date range if provided
		if (startDate && endDate) {
			const start = parseISO(startDate as string);
			const end = parseISO(endDate as string);

			events = events.filter((event) => {
				const eventStart = parseISO(event.date);
				const eventEnd = event.endDate
					? parseISO(event.endDate)
					: eventStart;

				return (
					isWithinInterval(eventStart, { start, end }) ||
					isWithinInterval(eventEnd, { start, end }) ||
					(eventStart <= start && eventEnd >= end)
				);
			});
		}

		const csv = eventsToCSV(events, users);

		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename=events-${site}-${userId}-${format(new Date(), "yyyy-MM-dd")}.csv`
		);
		res.send(csv);
	} catch (error) {
		console.error("Error exporting user events:", error);
		res.status(500).json({ message: "Failed to export user events" });
	}
});

export { router as exportRouter };
