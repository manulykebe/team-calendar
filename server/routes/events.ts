import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import {
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/events.js";
import { getSocketManager } from "../websocket/socketManager.js";
import { readSiteData } from "../utils.js";
import { z } from "zod";

const router = Router();

router.use(authenticateToken);

// Event validation schema
const eventSchema = z.object({
  type: z.string().optional().default(""),
  title: z.string().optional().default(""),
  description: z.string().max(500).optional().default(""),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD")
    .optional(),
  status: z.enum(['pending', 'approved', 'denied']).optional(),
  userId: z.string().optional() // For admin updates, allow specifying user
});

// Helper function to find an event across all users in a site
async function findEventAcrossSite(site: string, eventId: string): Promise<{ event: any; userId: string } | null> {
  try {
    const siteData = await readSiteData(site);
    
    for (const user of siteData.users) {
      try {
        const userEvents = await getUserEvents(site, user.id);
        const foundEvent = userEvents.find(e => e.id === eventId);
        if (foundEvent) {
          return { event: foundEvent, userId: user.id };
        }
      } catch (error) {
        // Continue searching if we can't access this user's events
        console.warn(`Failed to get events for user ${user.id}:`, error);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to search for event ${eventId} across site ${site}:`, error);
    return null;
  }
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    // Check if this is an admin requesting specific user's events
    const requestedUserId = req.headers['x-user-id'] as string;

    if (requestedUserId && req.user!.role === 'admin') {
      // Admin requesting specific user's events
      const events = await getUserEvents(req.user!.site, requestedUserId);
      res.json(events);
    } else if (req.user!.role === 'admin' && !requestedUserId) {
      // Admin requesting all site events - this shouldn't happen with the new approach
      // but keeping as fallback
      const siteData = await readSiteData(req.user!.site);
      const allEvents: any[] = [];

      // Collect events from all users in the site
      for (const user of siteData.users) {
        try {
          const userEvents = await getUserEvents(req.user!.site, user.id);
          allEvents.push(...userEvents);
        } catch (error) {
          // Continue if we can't get events for a specific user
          console.warn(`Failed to get events for user ${user.id}:`, error);
        }
      }

      res.json(allEvents);
    } else {
      // Regular user requesting their own events
      const events = await getUserEvents(req.user!.site, req.user!.id);
      res.json(events);
    }
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to fetch events",
    });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = eventSchema.parse(req.body);

    const event = await createEvent({
      ...validatedData,
      userId: validatedData.userId || req.user!.id,
      site: req.user!.site,
    });

    // Broadcast event creation to other users
    const socketManager = getSocketManager();
    if (socketManager) {
      socketManager.broadcastEventChange(
        req.user!.site,
        event,
        'created',
        req.user!.id
      );
    }

    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create event",
      });
    }
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user!.role === 'admin';

    // Use different validation schema for admins
    let validatedData: any;
    validatedData = eventSchema.parse(req.body);

    // For admin updates, allow updating events of other users
    let targetUserId = req.user!.id;
    if (isAdmin && validatedData.userId) {
      targetUserId = validatedData.userId;
      // Remove userId from the data to pass to updateEvent
      const { userId, ...eventData } = validatedData;
      validatedData = eventData;
    }

    const event = await updateEvent({
      id: req.params.id,
      ...validatedData,
      endDate: validatedData.endDate || validatedData.date,
      userId: targetUserId,
      site: req.user!.site,
      isAdmin: isAdmin,
    });

    // Broadcast event update to other users
    const socketManager = getSocketManager();
    if (socketManager) {
      socketManager.broadcastEventChange(
        req.user!.site,
        event,
        'updated',
        req.user!.id
      );
    }

    res.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      res.status(403).json({
        message: error instanceof Error ? error.message : "Not authorized",
      });
    }
  }
});

// New admin-only route for bulk status updates
router.patch("/bulk-status", async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { eventIds, status } = z.object({
      eventIds: z.array(z.string()),
      status: z.enum(['pending', 'approved', 'denied'])
    }).parse(req.body);

    const updatedEvents = [];

    for (const eventId of eventIds) {
      try {
        // Get the event first to find the owner
        const siteData = await readSiteData(req.user!.site);
        let eventOwner = null;
        let targetEvent = null;

        // Find the event and its owner
        for (const user of siteData.users) {
          const userEvents = await getUserEvents(req.user!.site, user.id);
          const foundEvent = userEvents.find(e => e.id === eventId);
          if (foundEvent) {
            eventOwner = user;
            targetEvent = foundEvent;
            break;
          }
        }

        if (targetEvent && eventOwner) {
          const updatedEvent = await updateEvent({
            ...targetEvent,
            id: eventId,
            status,
            userId: eventOwner.id,
            site: req.user!.site,
            isAdmin: true,
          });
          updatedEvents.push(updatedEvent);
        }
      } catch (error) {
        console.warn(`Failed to update event ${eventId}:`, error);
      }
    }

    // Broadcast updates
    const socketManager = getSocketManager();
    if (socketManager) {
      updatedEvents.forEach(event => {
        socketManager.broadcastEventChange(
          req.user!.site,
          event,
          'updated',
          req.user!.id
        );
      });
    }

    res.json({
      message: `Updated ${updatedEvents.length} events`,
      updatedEvents
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to update events",
      });
    }
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const requestBody = req.body || {};
    const isAdmin = req.user!.role === 'admin';
    let targetUserId = requestBody.userId || req.user!.id;
    let eventToDelete = null;

    if (isAdmin) {
      // For admin users, use robust search to find the event across all users
      const eventResult = await findEventAcrossSite(req.user!.site, req.params.id);
      
      if (!eventResult) {
        return res.status(404).json({
          message: "Event not found"
        });
      }
      
      eventToDelete = eventResult.event;
      targetUserId = eventResult.userId;
    } else {
      // For regular users, get the event from their own events
      const events = await getUserEvents(req.user!.site, req.user!.id);
      eventToDelete = events.find(e => e.id === req.params.id);
      
      if (!eventToDelete) {
        return res.status(404).json({
          message: "Event not found"
        });
      }
    }

    await deleteEvent({
      id: req.params.id,
      userId: targetUserId,
      site: req.user!.site,
      isAdmin: isAdmin,
    });

    // Broadcast event deletion to other users
    const socketManager = getSocketManager();
    if (socketManager && eventToDelete) {
      socketManager.broadcastEventChange(
        req.user!.site,
        eventToDelete,
        'deleted',
        req.user!.id
      );
    }

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to delete event",
    });
  }
});

export { router as eventRouter };