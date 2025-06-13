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
				`LOCATION:Antwerp Ontspanningslaan 4 2960 BRECHT`,
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
		"BEGIN:DAYLIGHT",
		"TZOFFSETFROM:+0100",
		"TZOFFSETTO:+0200",
		"TZNAME:CEST",
		"DTSTART:19810329T020000",
		"RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
		"END:DAYLIGHT",
		"BEGIN:STANDARD",
		"TZOFFSETFROM:+0200",
		"TZOFFSETTO:+0100",
		"TZNAME:CET",
		"DTSTART:19961027T030000",
		"RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
		"END:STANDARD",
		"BEGIN:STANDARD",
		"TZOFFSETFROM:+001932",
		"TZOFFSETTO:+001932",
		"TZNAME:AMT",
		"DTSTART:18350101T000000",
		"RDATE:18350101T000000",
		"END:STANDARD",
		"BEGIN:DAYLIGHT",
		"TZOFFSETFROM:+001932",
		"TZOFFSETTO:+011932",
		"TZNAME:NST",
		"DTSTART:19160501T004028",
		"RDATE:19160501T004028",
		"RDATE:19170416T024028",
		"RDATE:19180401T024028",
		"RDATE:19190407T024028",
		"RDATE:19200405T024028",
		"RDATE:19210404T024028",
		"RDATE:19220326T024028",
		"RDATE:19230601T024028",
		"RDATE:19240330T024028",
		"RDATE:19250605T024028",
		"RDATE:19260515T024028",
		"RDATE:19270515T024028",
		"RDATE:19280515T024028",
		"RDATE:19290515T024028",
		"RDATE:19300515T024028",
		"RDATE:19310515T024028",
		"RDATE:19320522T024028",
		"RDATE:19330515T024028",
		"RDATE:19340515T024028",
		"RDATE:19350515T024028",
		"RDATE:19360515T024028",
		"RDATE:19370522T024028",
		"END:DAYLIGHT",
		"BEGIN:STANDARD",
		"TZOFFSETFROM:+011932",
		"TZOFFSETTO:+001932",
		"TZNAME:AMT",
		"DTSTART:19161001T004028",
		"RDATE:19161001T004028",
		"RDATE:19170917T034028",
		"RDATE:19180930T034028",
		"RDATE:19190929T034028",
		"RDATE:19200927T034028",
		"RDATE:19210926T034028",
		"RDATE:19221008T034028",
		"RDATE:19231007T034028",
		"RDATE:19241005T034028",
		"RDATE:19251004T034028",
		"RDATE:19261003T034028",
		"RDATE:19271002T034028",
		"RDATE:19281007T034028",
		"RDATE:19291006T034028",
		"RDATE:19301005T034028",
		"RDATE:19311004T034028",
		"RDATE:19321002T034028",
		"RDATE:19331008T034028",
		"RDATE:19341007T034028",
		"RDATE:19351006T034028",
		"RDATE:19361004T034028",
		"END:STANDARD",
		"BEGIN:DAYLIGHT",
		"TZOFFSETFROM:+011932",
		"TZOFFSETTO:+0120",
		"TZNAME:NEST",
		"DTSTART:19370701T004028",
		"RDATE:19370701T004028",
		"END:DAYLIGHT",
		"BEGIN:STANDARD",
		"TZOFFSETFROM:+0120",
		"TZOFFSETTO:+0020",
		"TZNAME:NET",
		"DTSTART:19371003T034000",
		"RDATE:19371003T034000",
		"RDATE:19381002T034000",
		"RDATE:19391008T034000",
		"END:STANDARD",
		"BEGIN:DAYLIGHT",
		"TZOFFSETFROM:+0020",
		"TZOFFSETTO:+0120",
		"TZNAME:NEST",
		"DTSTART:19380515T024000",
		"RDATE:19380515T024000",
		"RDATE:19390515T024000",
		"END:DAYLIGHT",
		"BEGIN:DAYLIGHT",
		"TZOFFSETFROM:+0020",
		"TZOFFSETTO:+0200",
		"TZNAME:CEST",
		"DTSTART:19400516T004000",
		"RDATE:19400516T004000",
		"END:DAYLIGHT",
		"BEGIN:STANDARD",
		"TZOFFSETFROM:+0200",
		"TZOFFSETTO:+0100",
		"TZNAME:CET",
		"DTSTART:19421102T030000",
		"RDATE:19421102T030000",
		"RDATE:19431004T030000",
		"RDATE:19441002T030000",
		"RDATE:19450916T030000",
		"RDATE:19770925T030000",
		"RDATE:19781001T030000",
		"RDATE:19790930T030000",
		"RDATE:19800928T030000",
		"RDATE:19810927T030000",
		"RDATE:19820926T030000",
		"RDATE:19830925T030000",
		"RDATE:19840930T030000",
		"RDATE:19850929T030000",
		"RDATE:19860928T030000",
		"RDATE:19870927T030000",
		"RDATE:19880925T030000",
		"RDATE:19890924T030000",
		"RDATE:19900930T030000",
		"RDATE:19910929T030000",
		"RDATE:19920927T030000",
		"RDATE:19930926T030000",
		"RDATE:19940925T030000",
		"RDATE:19950924T030000",
		"END:STANDARD",
		"BEGIN:DAYLIGHT",
		"TZOFFSETFROM:+0100",
		"TZOFFSETTO:+0200",
		"TZNAME:CEST",
		"DTSTART:19430329T020000",
		"RDATE:19430329T020000",
		"RDATE:19440403T020000",
		"RDATE:19450402T020000",
		"RDATE:19770403T020000",
		"RDATE:19780402T020000",
		"RDATE:19790401T020000",
		"RDATE:19800406T020000",
		"END:DAYLIGHT",
		"BEGIN:STANDARD",
		"TZOFFSETFROM:+0100",
		"TZOFFSETTO:+0100",
		"TZNAME:CET",
		"DTSTART:19770101T000000",
		"RDATE:19770101T000000",
		"END:STANDARD",
		"END:VTIMEZONE",
		icalEvents,
		"END:VCALENDAR",
	].join("\r\n");
	// Ensure CRLF line endings
	return calendar.replace(/\n/g, "\r\n");
}

export { router as agendaRouter };
