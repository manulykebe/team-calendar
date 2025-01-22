import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import {
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/events.js";
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
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const events = await getUserEvents(req.user!.site, req.user!.id);
    res.json(events);
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
      userId: req.user!.id,
      site: req.user!.site,
    });

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
    const validatedData = eventSchema.parse(req.body);

    const event = await updateEvent({
      id: req.params.id,
      ...validatedData,
      endDate: validatedData.endDate || validatedData.date, // Fallback to date if endDate not provided
      userId: req.user!.id,
      site: req.user!.site,
    });
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

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await deleteEvent({
      id: req.params.id,
      userId: req.user!.id,
      site: req.user!.site,
      userRole: req.user!.role,
    });
    res.sendStatus(204);
  } catch (error) {
    res.status(403).json({
      message: error instanceof Error ? error.message : "Not authorized",
    });
  }
});

export { router as eventRouter };