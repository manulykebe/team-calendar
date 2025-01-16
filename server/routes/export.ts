import { Router } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { readSiteData } from "../utils";
import { format, parseISO, isWithinInterval } from "date-fns";

const router = Router();

router.use(authenticateToken);

// Helper function to convert events to CSV
function eventsToCSV(events: any[], users: any[], includeHeaders = true) {
	const headers = [
		"User",
		"Type",
		"Title",
		"Description",
		"Start Date",
		"End Date",
		"Created At",
		"Updated At",
	];

	const rows = events.map((event) => {
		const user = users.find((u) => u.id === event.userId);
		return [
			user?.initials || "Unknown",
			event.type,
			`"${event.title || ""}"`,
			`"${event.description || ""}"`,
			event.date,
			event.endDate || "",
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
		let events = [...siteData.events];
		let users = [...siteData.users];
		// Filter by date range if provided
		if (startDate && endDate) {
			const start = parseISO(startDate as string);
			const end = parseISO(endDate as string);

			events = events.filter((event) => {
				const eventDate = parseISO(event.date);
				const eventEndDate = event.endDate
					? parseISO(event.endDate)
					: eventDate;

				return (
					isWithinInterval(eventDate, { start, end }) ||
					isWithinInterval(eventEndDate, { start, end }) ||
					(eventDate <= start && eventEndDate >= end)
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

		let users = [...siteData.users];

		let events = siteData.events.filter((event) => event.userId === userId);

		// Filter by date range if provided
		if (startDate && endDate) {
			const start = parseISO(startDate as string);
			const end = parseISO(endDate as string);

			events = events.filter((event) => {
				const eventDate = parseISO(event.date);
				const eventEndDate = event.endDate
					? parseISO(event.endDate)
					: eventDate;

				return (
					isWithinInterval(eventDate, { start, end }) ||
					isWithinInterval(eventEndDate, { start, end }) ||
					(eventDate <= start && eventEndDate >= end)
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
