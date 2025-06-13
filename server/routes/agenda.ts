import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import { readSiteData, writeSiteData, readUserEvents } from "../utils.js";
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
		const { from, to } = req.query; // Add date range query parameters

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

		// Get user's events with optional date filtering
		let events = await readUserEvents(site, userId);

		// Filter by date range if provided
		if (from && to) {
			const startDate = parseISO(from as string);
			const endDate = parseISO(to as string);
			events = events.filter((e: Event) => {
				const eventStart = parseISO(e.date);
				const eventEnd = e.endDate ? parseISO(e.endDate) : eventStart;
				return eventStart <= endDate && eventEnd >= startDate;
			});
		}

		// Generate and send iCal content
		const icalContent = generateICalContent(events, user);
		res.setHeader("Content-Type", "text/calendar"); // charset=UTF-8");
		// res.setHeader(
		// 	"Content-Disposition",
		// 	"attachment; filename=calendar.ics"
		// );
		res.setHeader(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains"
		);
		res.setHeader("X-Cache-Status", "MISS");
		res.setHeader("cache-control", "private");
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
	const prodId = "-//Team Calendar//AZJP Team Calendar V1.0//EN";
	const calendarName =
		`${user.firstName} ${user.lastName}'s Calendar`.replace(
			/[\\;,]/g,
			(match) => "\\" + match
		);

	const icalEvents = events
		.map((event) => {
			const startDate = format(parseISO(event.date), "yyyyMMdd");
			const endDate = event.endDate
				? format(addDays(parseISO(event.endDate), 0), "yyyyMMdd")
				: format(addDays(parseISO(event.date), 0), "yyyyMMdd");
			const eventUid = `${event.id}-${startDate}@teamcalendar`;
			const summary =( event.type=== "requestedHoliday"?`Holiday (${event.status})`:"xxx")
				.replace(/[\\;,]/g, (match) => "\\" + match)
				.replace(/\n/g, "\\n");
			const description = event.description
				? event.description
						.replace(/[\\;,]/g, (match) => "\\" + match)
						.replace(/\n/g, "\\n")
				: "";

			return [
				"BEGIN:VEVENT",
				`DTSTAMP:${timestamp}`,
				`UID:${eventUid}`,
				`SEQUENCE:0`,
				`TRANSP:OPAQUE`,
				`CLASS:PUBLIC`,
				`SUMMARY:${summary}`,
				`DTSTART;TZID=Europe/Amsterdam:${startDate}T000000`,
				`DTEND;TZID=Europe/Amsterdam:${endDate}T235959`,
				description ? `DESCRIPTION:${description}` : "",
				`ORGANIZER;CN=AZJP Team Calendar:MAILTO:team-calendar@lyke.be`,
				"END:VEVENT",
			]
				.filter(Boolean)
				.join("\r\n");
		})
		.join("\r\n");

	const calendar = [
		"BEGIN:VCALENDAR",
		`PRODID:${prodId}`,
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"X-WR-CALNAME:AZJP Team Calendar",
		"X-WR-CALDESC:Read-only Team Calendar Feed",
		"X-PUBLISHED-TTL:PT1H",
		"REFRESH-INTERVAL;VALUE=DURATION:PT1H",
		"BEGIN:VTIMEZONE",
		"TZID:Europe/Amsterdam",
		"TZURL:http://tzurl.org/zoneinfo/Europe/Amsterdam",
		"X-LIC-LOCATION:Europe/Amsterdam",
		"END:VTIMEZONE",
		icalEvents,
		"END:VCALENDAR",
	].join("\r\n");
	// Ensure CRLF line endings
	return calendar.replace(/\n/g, "\r\n");
}

export { router as agendaRouter };
