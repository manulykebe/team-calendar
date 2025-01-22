import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import { readSiteData, writeSiteData } from "../utils.js";
import { format, parseISO, startOfDay, endOfDay, addDays } from "date-fns";
import { Event } from "../types.js";
import crypto from "crypto";
import { JWT_SECRET } from "../config.js";

const router = Router();

// Generate a subscription token
function generateSubscriptionToken(userId: string, site: string): string {
	const data = `${userId}:${site}:${JWT_SECRET}`;
	return crypto.createHash("sha256").update(data).digest("hex");
}

// Verify subscription token
function verifySubscriptionToken(
	token: string,
	userId: string,
	site: string
): boolean {
	const expectedToken = generateSubscriptionToken(userId, site);
	return token === expectedToken;
}

// Get subscription URL for user's calendar
router.get(
	"/:siteID/:userId/subscribe",
	authenticateToken,
	async (req: AuthRequest, res) => {
		try {
			const { siteID, userId } = req.params;

			const siteData = await readSiteData(siteID);
			const user = siteData.users.find((u: any) => u.id === userId);

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			// Generate subscription token
			const token = generateSubscriptionToken(userId, siteID);

			// Generate subscription URL with webcal:// protocol
			const host = req.get("host");
			const subscriptionUrl = `webcal://${host}/api/agenda/${siteID}/${userId}/calendar/${token}`;

			res.json({
				subscriptionUrl,
				instructions:
					"To subscribe to this calendar, copy the URL and add it to your calendar application as a subscription calendar.",
			});
		} catch (error) {
			console.error("Error generating subscription URL:", error);
			res.status(500).json({
				message: "Failed to generate subscription URL",
			});
		}
	}
);

// Public calendar endpoint for subscriptions
router.get("/:site/:userId/calendar/:token", async (req, res) => {
	try {
		const { site, userId, token } = req.params;

		// Verify the subscription token
		if (!verifySubscriptionToken(token, userId, site)) {
			return res
				.status(401)
				.json({ message: "Invalid subscription token" });
		}

		const siteData = await readSiteData(site);
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

		// Set headers for iCal
		res.setHeader("Content-Type", "text/calendar; charset=UTF-8");
		res.setHeader("Content-Disposition", "inline; filename=calendar.ics");
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		res.setHeader("Pragma", "no-cache");
		res.setHeader("Expires", "0");

		res.send(icalContent);
	} catch (error) {
		console.error("Error serving calendar:", error);
		res.status(500).json({ message: "Failed to serve calendar" });
	}
});

// Protected JSON endpoint (keep existing implementation)
router.get(
	"/:siteID/:userId",
	authenticateToken,
	async (req: AuthRequest, res) => {
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

				userEvents = userEvents.filter((event: Event) => {
					const eventDate = parseISO(event.date);
					const eventEndDate = event.endDate
						? parseISO(event.endDate)
						: eventDate;
					return eventDate <= endDate && eventEndDate >= startDate;
				});
			}

			// Format events for response
			const formattedEvents = userEvents.map((event: Event) => ({
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
	}
);

// Helper function to generate iCal content
function generateICalContent(events: Event[], user: any): string {
	const now = new Date();
	const timestamp = format(now, "yyyyMMdd'T'HHmmss'Z'");
	const prodId = "-//Team Calendar//NONSGML Team Calendar V1.0//EN";

	const icalEvents = events
		.map((event) => {
			const startDate = format(parseISO(event.date), "yyyyMMdd");
			const endDate = event.endDate
				? format(addDays(parseISO(event.endDate), 1), "yyyyMMdd")
				: format(addDays(parseISO(event.date), 1), "yyyyMMdd");

			// Create a unique identifier that's consistent across updates
			const eventUid = `${event.id}-${startDate}@teamcalendar`;

			// Escape special characters in text fields
			const summary = (event.title || event.type)
				.replace(/[\\;,]/g, (match) => "\\" + match)
				.replace(/\n/g, "\\n");
			const description = (event.description || "")
				.replace(/[\\;,]/g, (match) => "\\" + match)
				.replace(/\n/g, "\\n");

			return [
				"BEGIN:VEVENT",
				`UID:${eventUid}`,
				`DTSTAMP:${timestamp}`,
				`DTSTART;VALUE=DATE:${startDate}`,
				`DTEND;VALUE=DATE:${endDate}`,
				`SUMMARY:${summary}`,
				description ? `DESCRIPTION:${description}` : "",
				"STATUS:CONFIRMED",
				"CLASS:PUBLIC",
				"TRANSP:TRANSPARENT",
				"SEQUENCE:0",
				"END:VEVENT",
			]
				.filter(Boolean)
				.join("\r\n");
		})
		.join("\r\n");

	const calendarName =
		`${user.firstName} ${user.lastName}'s Calendar`.replace(
			/[\\;,]/g,
			(match) => "\\" + match
		);

	const calendar = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		`PRODID:${prodId}`,
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		`X-WR-CALNAME:${calendarName}`,
		"X-WR-CALDESC:Team Calendar Events",
		"X-WR-TIMEZONE:UTC",
		icalEvents,
		"END:VCALENDAR",
	].join("\r\n");

	// Ensure CRLF line endings
	return calendar.replace(/\n/g, "\r\n");
}

export { router as agendaRouter };
