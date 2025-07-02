import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import { readSiteData, readUserEvents } from "../utils.js";
import { readFile, getStorageKey } from "../services/storage.js";
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
				return res.status(404).json({ message: req.i18n.t('subscription.userNotFound') });
			}

			// Generate subscription token
			const token = generateSubscriptionToken(userId, siteID);

			// Generate subscription URL with webcal:// protocol
			const host = req.get("host");
			const subscriptionUrl = `webcal://${host}/api/agenda/${siteID}/${userId}/calendar/${token}`;

			res.json({
				subscriptionUrl,
				instructions: req.i18n.t('subscription.subscriptionInstructions'),
			});
		} catch (error) {
			console.error("Error generating subscription URL:", error);
			res.status(500).json({
				message: req.i18n.t('subscription.failedToGenerateSubscriptionURL'),
			});
		}
	}
);

// Public calendar endpoint for subscriptions
router.get("/:site/:userId/calendar/:token", async (req: AuthRequest, res) => {
	try {
		const { site, userId, token } = req.params;
		const { from, to } = req.query; // Add date range query parameters

		// Verify the subscription token
		if (!verifySubscriptionToken(token, userId, site)) {
			return res
				.status(401)
				.json({ message: req.i18n.t('subscription.invalidSubscriptionToken') });
		}

		const siteData = await readSiteData(site);
		const user = siteData.users.find((u: any) => u.id === userId);

		if (!user) {
			return res.status(404).json({ message: req.i18n.t('subscription.userNotFound') });
		}

		// Get user's events with optional date filtering
		let events = await readUserEvents(site, userId);
		// filter events where status is "approved"
		events = events.filter((e: Event) => e.status === "approved");

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

		// Get on-duty shifts for this user
		let onDutyShifts: any[] = [];
		try {
			const onDutyData = JSON.parse(await readFile(getStorageKey("sites", site, "events", "on-duty.json")));
			const dutyConfig = siteData.app?.duty || { startTime: "17:30", endTimeNextDay: "08:00" };

			// Filter shifts for this user
			onDutyShifts = onDutyData.schedule
				.filter((shift: any) => shift.userId === userId)
				.map((shift: any) => {
					const shiftDate = shift.date;
					const nextDay = format(addDays(parseISO(shiftDate), 1), "yyyy-MM-dd");

					return {
						id: `duty-${shiftDate}`,
						userId: userId,
						type: "onDuty",
						title: req.i18n.t('onDuty.onDutyShift'),
						description: req.i18n.t('onDuty.onDutyShiftDescription', { 
							firstName: user.firstName, 
							lastName: user.lastName 
						}),
						date: `${shiftDate}T${dutyConfig.startTime}:00`,
						endDate: `${nextDay}T${dutyConfig.endTimeNextDay}:00`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
					};
				});
		} catch (error) {
			console.warn("Could not load on-duty shifts:", error);
		}

		// Combine regular events with on-duty shifts
		const allEvents = [...events, ...onDutyShifts];

		// Generate and send iCal content
		const icalContent = generateICalContent(allEvents, user, req.i18n);
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
		res.status(500).json({ message: req.i18n.t('subscription.failedToServeCalendar') });
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
				return res.status(404).json({ message: req.i18n.t('subscription.userNotFound') });
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
			res.status(500).json({ message: req.i18n.t('subscription.failedToFetchAgenda') });
		}
	}
);

// Helper function to generate iCal content
function generateICalContent(events: Event[], user: any, i18n: any): string {
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
			// Handle different date formats for regular events vs on-duty events
			const isOnDutyEvent = event.type === "onDuty";

			// For on-duty events, the date already includes time
			const startDate = isOnDutyEvent
				? format(parseISO(event.date), "yyyyMMdd'T'HHmmss")
				: format(parseISO(event.date), "yyyyMMdd");

			const endDate = event.endDate
				? (isOnDutyEvent
					? format(parseISO(event.endDate), "yyyyMMdd'T'HHmmss")
					: format(addDays(parseISO(event.endDate), 0), "yyyyMMdd"))
				: startDate;

			const eventUid = `${event.id}-${startDate}@teamcalendar`;

			let summary = "";
			if (isOnDutyEvent) {
				summary = i18n.t('onDuty.onDutyShift');
			} else if (event.type === "requestedLeave") {
				summary = i18n.t('events.holiday', { status: event.status || 'pending' });
			} else {
				summary = event.title || event.type;
			}

			summary = summary.replace(/[\\;,]/g, (match) => "\\" + match).replace(/\n/g, "\\n");

			const description = event.description
				? event.description
					.replace(/[\\;,]/g, (match) => "\\" + match)
					.replace(/\n/g, "\\n")
				: "";

            // Different formatting for on-duty events vs. all-day events
            let dtStart, dtEnd;

            if (isOnDutyEvent) {
                // For on-duty events with specific times
                const startDateTime = format(parseISO(event.date), "yyyyMMdd'T'HHmmss");
                const endDateTime = event.endDate ? format(parseISO(event.endDate), "yyyyMMdd'T'HHmmss") : startDateTime;
                dtStart = `DTSTART:${startDateTime}`;
                dtEnd = `DTEND:${endDateTime}`;
            } else {
                // For all-day events, use VALUE=DATE format
                const allDayStartDate = format(parseISO(event.date), "yyyyMMdd");
                // The end date for an all-day event is exclusive, so it must be the day AFTER the event ends.
                const allDayEndDate = format(addDays(parseISO(event.endDate || event.date), 1), "yyyyMMdd");
                
                dtStart = `DTSTART;VALUE=DATE:${allDayStartDate}`;
                dtEnd = `DTEND;VALUE=DATE:${allDayEndDate}`;
            }

			return [
				"BEGIN:VEVENT",
				`DTSTAMP:${timestamp}`,
				`UID:${eventUid}`,
				`SEQUENCE:0`,
				`TRANSP:OPAQUE`,
				`CLASS:PUBLIC`,
				`SUMMARY:${summary}`,
				dtStart,
				dtEnd,
				// `LOCATION:Better Place`,
				description ? `DESCRIPTION:${description}` : "",
				`ORGANIZER;CN=${user.site.toUpperCase()} Team Calendar:MAILTO:${user.site}-team-calendar@lyke.be`,
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
		`X-WR-CALNAME:${user.site.toUpperCase()} ${user.firstName}`,
		"X-WR-CALDESC:This calendar feed is read-only. Changes made in your calendar app will not be saved nor reflected on the team calendar.",
		"X-PUBLISHED-TTL:PT10M",
		"REFRESH-INTERVAL;VALUE=DURATION:PT1H",
		"BEGIN:VTIMEZONE",
		"TZID:Europe/Brussels",
		"TZURL:http://tzurl.org/zoneinfo/Europe/Brussels",
		"X-LIC-LOCATION:Europe/Brussels",
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