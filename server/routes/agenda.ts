import { Router } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { readSiteData } from "../utils";
import { format, parseISO, startOfDay, endOfDay, addDays } from "date-fns";
import { Event } from "../types";

const router = Router();

router.get("/", (req, res) => {
	res.send("Hello from agenda route!");
});

// Require authentication for all agenda routes
// router.use(authenticateToken);

// Get user's agenda in iCal format
router.get("/:siteID/:userId/ical", async (req: AuthRequest, res) => {
	try {
		const { siteID, userId } = req.params;
		const siteData = await readSiteData(siteID);

		// Find user
		const user = siteData.users.find((u: any) => u.id === userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Get user's events
		const userEvents = siteData.events.filter(
			(e: Event) => e.userId === userId
		);

		// Generate iCal content
		const icalContent = generateICalContent(userEvents, user);

		// Set headers for iCal file download
		res.setHeader("Content-Type", "text/calendar");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${user.firstName}_${user.lastName}_agenda.ics"`
		);

		res.send(icalContent);
	} catch (error) {
		console.error("Error generating agenda:", error);
		res.status(500).json({ message: "Failed to generate agenda" });
	}
});

// Get user's agenda in JSON format with date range filter
router.get("/:siteID/:userId", async (req: AuthRequest, res) => {
	try {
		const { siteID, userId } = req.params;
		const { start, end } = req.query;
		const siteData = await readSiteData(siteID);

		// Find user
		const user = siteData.users.find((u: any) => u.id === userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Get user's events
		let userEvents = siteData.events.filter(
			(e: Event) => e.userId === userId
		);

		// Apply date range filter if provided
		if (start && end) {
			const startDate = startOfDay(parseISO(start as string));
			const endDate = endOfDay(parseISO(end as string));

			userEvents = userEvents.filter((event) => {
				const eventDate = parseISO(event.date);
				const eventEndDate = event.endDate
					? parseISO(event.endDate)
					: eventDate;
				return eventDate <= endDate && eventEndDate >= startDate;
			});
		}

		// Format events for response
		const formattedEvents = userEvents.map((event) => ({
			id: event.id,
			title: event.title || event.type,
			description: event.description,
			start: event.date,
			end: event.endDate || event.date,
			type: event.type,
		}));

		res.json({
			user: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`,
				email: user.email,
			},
			events: formattedEvents,
		});
	} catch (error) {
		console.error("Error fetching agenda:", error);
		res.status(500).json({ message: "Failed to fetch agenda" });
	}
});

// Helper function to generate iCal content
function generateICalContent(events: Event[], user: any): string {
	const now = new Date();
	const icalEvents = events
		.map((event) => {
			const startDate = format(parseISO(event.date), "yyyyMMdd");
			const endDate = event.endDate
				? format(parseISO(event.endDate), "yyyyMMdd")
				: format(addDays(parseISO(event.date), 1), "yyyyMMdd");

			return `
BEGIN:VEVENT
UID:${event.id}
DTSTAMP:${format(now, "yyyyMMdd'T'HHmmss'Z'")}
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${endDate}
SUMMARY:${event.title || event.type}
DESCRIPTION:${event.description || ""}
STATUS:CONFIRMED
END:VEVENT`.trim();
		})
		.join("\n");

	return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Team Calendar//NONSGML v1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${user.firstName} ${user.lastName}'s Calendar
X-WR-TIMEZONE:UTC
${icalEvents}
END:VCALENDAR`;
}

export { router as agendaRouter };
