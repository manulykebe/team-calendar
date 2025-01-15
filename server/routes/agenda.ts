import { Router } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { readSiteData, writeSiteData } from "../utils";
import { format, parseISO, startOfDay, endOfDay, addDays } from "date-fns";
import { Event } from "../types";
import crypto from "crypto";
import { JWT_SECRET } from "../config";

const router = Router();

// Generate a subscription token
function generateSubscriptionToken(userId: string, site: string): string {
  const data = `${userId}:${site}:${JWT_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Verify subscription token
function verifySubscriptionToken(token: string, userId: string, site: string): boolean {
  const expectedToken = generateSubscriptionToken(userId, site);
  return token === expectedToken;
}

// Get subscription URL for user's calendar
router.get("/:siteID/:userId/subscribe", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { siteID, userId } = req.params;
    
    const siteData = await readSiteData(siteID);
    const user = siteData.users.find((u: any) => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate subscription token
    const token = generateSubscriptionToken(userId, siteID);
    
    // Generate subscription URL
    const subscriptionUrl = `${req.protocol}://${req.get('host')}/api/agenda/${siteID}/${userId}/calendar/${token}`;
    
    res.json({
      subscriptionUrl,
      instructions: "To subscribe to this calendar, copy the URL and add it to your calendar application as a subscription calendar."
    });
  } catch (error) {
    console.error("Error generating subscription URL:", error);
    res.status(500).json({ message: "Failed to generate subscription URL" });
  }
});

// Public calendar endpoint for subscriptions
router.get("/:site/:userId/calendar/:token", async (req, res) => {
  try {
    const { site, userId, token } = req.params;

    // Verify the subscription token
    if (!verifySubscriptionToken(token, userId, site)) {
      return res.status(401).json({ message: "Invalid subscription token" });
    }

    const siteData = await readSiteData(site);
    const user = siteData.users.find((u: any) => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's events
    const userEvents = siteData.events.filter((e: Event) => e.userId === userId);

    // Generate iCal content
    const icalContent = generateICalContent(userEvents, user);

    // Set headers for iCal
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=calendar.ics");
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
router.get("/:siteID/:userId", authenticateToken, async (req: AuthRequest, res) => {
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
    let userEvents = siteData.events.filter((e: Event) => e.userId === userId);

    // Apply date range filter if provided
    if (start && end) {
      const startDate = startOfDay(parseISO(start as string));
      const endDate = endOfDay(parseISO(end as string));

      userEvents = userEvents.filter((event) => {
        const eventDate = parseISO(event.date);
        const eventEndDate = event.endDate ? parseISO(event.endDate) : eventDate;
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
  const timestamp = format(now, "yyyyMMdd'T'HHmmss'Z'");
  
  const icalEvents = events
    .map((event) => {
      const startDate = format(parseISO(event.date), "yyyyMMdd");
      const endDate = event.endDate
        ? format(addDays(parseISO(event.endDate), 1), "yyyyMMdd")
        : format(addDays(parseISO(event.date), 1), "yyyyMMdd");

      // Escape special characters in text fields
      const summary = (event.title || event.type)
        .replace(/[\\;,]/g, (match) => '\\' + match);
      const description = (event.description || "")
        .replace(/[\\;,]/g, (match) => '\\' + match)
        .replace(/\n/g, '\\n');

      return `BEGIN:VEVENT
UID:${event.id}@teamcalendar
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${endDate}
SUMMARY:${summary}
DESCRIPTION:${description}
STATUS:CONFIRMED
CLASS:PUBLIC
TRANSP:TRANSPARENT
SEQUENCE:0
END:VEVENT`;
    })
    .join("\r\n");

  const calendarName = `${user.firstName} ${user.lastName}'s Calendar`
    .replace(/[\\;,]/g, (match) => '\\' + match);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Team Calendar//NONSGML v1.0//EN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}
X-WR-TIMEZONE:UTC
CALSCALE:GREGORIAN
${icalEvents}
END:VCALENDAR`.split('\n').join('\r\n');
}

export { router as agendaRouter };