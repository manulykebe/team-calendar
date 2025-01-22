import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { AuthRequest } from "../types";
import {
	getUsers,
	createUser,
	updateUser,
	deleteUser,
} from "../services/users";
import { readSiteData, writeSiteData, readUserSettings, writeUserSettings } from "../utils";

const router = Router();

router.use(authenticateToken);

// Get all users for the current site
router.get("/", async (req: AuthRequest, res) => {
	try {
		const users = await getUsers(req.user!.site);
		res.json(users);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch users" });
	}
});

// Create a new user
router.post("/", async (req: AuthRequest, res) => {
	try {
		const user = await createUser({
			...req.body,
			site: req.user!.site,
		});
		res.status(201).json(user);
	} catch (error) {
		res.status(400).json({
			message:
				error instanceof Error
					? error.message
					: "Failed to create user",
		});
	}
});

// Update a user
router.put("/:id", async (req: AuthRequest, res) => {
	try {
		const user = await updateUser(req.params.id, {
			...req.body,
			site: req.user!.site,
		});
		res.json(user);
	} catch (error) {
		res.status(400).json({
			message:
				error instanceof Error
					? error.message
					: "Failed to update user",
		});
	}
});

// Update availability exceptions
router.put("/:id/exceptions", async (req: AuthRequest, res) => {
	try {
		const { date, part, value } = req.body;
		const siteData = await readSiteData(req.user!.site);
		const userIndex = siteData.users.findIndex(
			(u: any) => u.id === req.params.id
		);

		if (userIndex === -1) {
			return res.status(404).json({ message: "User not found" });
		}
		const settings = await readUserSettings(req.user!.site, req.user!.id);
		if (!settings.availabilityExceptions) {
			settings.availabilityExceptions = [];
		}

		// Find existing exception for this date
		const existingExceptionIndex =
			settings.availabilityExceptions.findIndex(
				(ex: any) => ex.date === date
			);

		if (existingExceptionIndex >= 0) {
			// Update existing exception
			settings.availabilityExceptions[existingExceptionIndex] = {
				...settings.availabilityExceptions[existingExceptionIndex],
				[part]: value,
			};
		} else {
			// Create new exception
			settings.availabilityExceptions.push({
				date,
				[part]: value,
			});
		}

		// Write updated data back to file
		await writeUserSettings(req.user!.site, req.user!.id, settings);

		res.json(settings);
	} catch (error) {
		res.status(400).json({
			message:
				error instanceof Error
					? error.message
					: "Failed to update exceptions",
		});
	}
});

// Delete a user
router.delete("/:id", async (req: AuthRequest, res) => {
	try {
		await deleteUser(req.params.id, req.user!.site);
		res.sendStatus(204);
	} catch (error) {
		res.status(400).json({
			message:
				error instanceof Error
					? error.message
					: "Failed to delete user",
		});
	}
});

export { router as userRouter };
