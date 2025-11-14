import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";
import { readUserSettings, writeUserSettings, readSiteData } from "../utils.js";
import { getSocketManager } from "../websocket/socketManager.js";
import { z } from "zod";

const router = Router();

router.use(authenticateToken);

// Get availability for all users in the site
router.get("/", async (req: AuthRequest, res) => {
	try {
		const siteData = await readSiteData(req.user!.site);
		const usersAvailability = [];

		for (const user of siteData.users) {
			try {
				const settings = await readUserSettings(req.user!.site, user.id);
				usersAvailability.push({
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					availability: settings?.availability || [],
				});
			} catch (error) {
				// If user settings don't exist, include user with empty availability
				usersAvailability.push({
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					availability: [],
				});
			}
		}

		res.json(usersAvailability);
	} catch (error) {
		res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Failed to fetch all users availability",
		});
	}
});

// Validation schemas
const timeSlotSchema = z.object({
	am: z.boolean(),
	pm: z.boolean(),
});

const weeklyScheduleSchema = z.object({
	Monday: timeSlotSchema,
	Tuesday: timeSlotSchema,
	Wednesday: timeSlotSchema,
	Thursday: timeSlotSchema,
	Friday: timeSlotSchema,
	Saturday: timeSlotSchema.optional(),
	Sunday: timeSlotSchema.optional(),
});

const scheduleSchema = z.object({
	weeklySchedule: weeklyScheduleSchema,
	oddWeeklySchedule: weeklyScheduleSchema.optional(),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
	endDate: z
		.union([
			z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
			z.literal(""),
		])
		.optional(),
	repeatPattern: z.enum(["all", "evenodd"]),
}) as z.ZodType<any>;

// Get all schedules for a user
router.get("/:userId", async (req: AuthRequest, res) => {
	try {
		const settings = await readUserSettings(
			req.user!.site,
			req.params.userId
		);
		const schedules = settings?.availability || [];
		res.json(schedules);
	} catch (error) {
		res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Failed to fetch schedules",
		});
	}
});

// Add a new schedule
router.post("/:userId/:index", async (req: AuthRequest, res) => {
	try {
		const schedule = scheduleSchema.parse(req.body) as any;
		const settings = await readUserSettings(
			req.user!.site,
			req.params.userId
		);

		if (!settings.availability) {
			settings.availability = [];
		}

		settings.availability.splice(parseInt(req.params.index), 0, schedule);
		await writeUserSettings(req.user!.site, req.params.userId, settings);

		// Broadcast availability change to other users
		const socketManager = getSocketManager();
		if (socketManager) {
			socketManager.broadcastAvailabilityChange(
				req.user!.site,
				req.params.userId,
				settings.availability
			);
		}

		res.status(201).json(schedule);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				message: "Validation error",
				errors: error.errors,
			});
		} else {
			res.status(500).json({
				message:
					error instanceof Error
						? error.message
						: "Failed to create schedule",
			});
		}
	}
});

// Update a schedule
router.put("/:userId/:index", async (req: AuthRequest, res) => {
	try {
		const schedule = scheduleSchema.parse(req.body) as any;
		const index = parseInt(req.params.index);
		const settings = await readUserSettings(
			req.user!.site,
			req.params.userId
		);

		if (!settings.availability) {
			settings.availability = [];
		}

		if (index < 0 || index >= settings.availability.length) {
			return res.status(404).json({ message: "Schedule not found" });
		}

		settings.availability[index] = schedule;
		await writeUserSettings(req.user!.site, req.params.userId, settings);

		// Broadcast availability change to other users
		const socketManager = getSocketManager();
		if (socketManager) {
			socketManager.broadcastAvailabilityChange(
				req.user!.site,
				req.params.userId,
				settings.availability
			);
		}

		res.json(schedule);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				message: "Validation error",
				errors: error.errors,
			});
		} else {
			res.status(500).json({
				message:
					error instanceof Error
						? error.message
						: "Failed to update schedule",
			});
		}
	}
});

// Delete a schedule
router.delete("/:userId/:index", async (req: AuthRequest, res) => {
	try {
		const index = parseInt(req.params.index);
		const settings = await readUserSettings(
			req.user!.site,
			req.params.userId
		);

		if (!settings.availability) {
			settings.availability = [];
		}

		if (index < 0 || index >= settings.availability.length) {
			return res.status(404).json({ message: "Schedule not found" });
		}

		settings.availability.splice(index, 1);
		await writeUserSettings(req.user!.site, req.params.userId, settings);

		// Broadcast availability change to other users
		const socketManager = getSocketManager();
		if (socketManager) {
			socketManager.broadcastAvailabilityChange(
				req.user!.site,
				req.params.userId,
				settings.availability
			);
		}

		res.sendStatus(204);
	} catch (error) {
		res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Failed to delete schedule",
		});
	}
});

// Reorder schedules
router.put("/:userId/reorder", async (req: AuthRequest, res) => {
	try {
		const { schedules } = z
			.object({
				schedules: z.array(scheduleSchema),
			})
			.parse(req.body);

		const settings = await readUserSettings(
			req.user!.site,
			req.params.userId
		);
		settings.availability = schedules;
		await writeUserSettings(req.user!.site, req.params.userId, settings);

		// Broadcast availability change to other users
		const socketManager = getSocketManager();
		if (socketManager) {
			socketManager.broadcastAvailabilityChange(
				req.user!.site,
				req.params.userId,
				schedules
			);
		}

		res.json(schedules);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				message: "Validation error",
				errors: error.errors,
			});
		} else {
			res.status(500).json({
				message:
					error instanceof Error
						? error.message
						: "Failed to reorder schedules",
			});
		}
	}
});

export { router as availabilityRouter };