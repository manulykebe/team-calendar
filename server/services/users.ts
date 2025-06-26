import bcrypt from "bcryptjs";
import { UserSettings } from "../types.js";
import { User } from "../types/user.js";
import {
	readSiteData,
	writeSiteData,
	readUserSettings,
	writeUserSettings,
} from "../utils.js";

export async function getUsers(site: string) {
	const data = await readSiteData(site);

	// Load settings for each user
	const usersWithSettings = await Promise.all(
		data.users.map(async (user: User) => {
			const settings = await readUserSettings(site, user.id);
			return { ...user, settings };
		})
	);

	return usersWithSettings;
}

export async function createUser(
  token: string,
  userData: UserFormData,
) {
	const data = await readSiteData(userData.site);

	if (data.users.some((u: User) => u.email === userData.email)) {
		throw new Error("Email already exists");
	}

	const hashedPassword = await bcrypt.hash(userData.password, 10);
	const newUser: User = {
		id: crypto.randomUUID(),
		...userData,
		password: hashedPassword,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	// Create empty settings file for new user
	await writeUserSettings(userData.site, newUser.id, {
		colleagues: {},
		showWeekNumber: "left",
		colleagueOrder: [],
		availability: [],
		availabilityExceptions: [],
	});

	data.users.push(newUser);
	await writeSiteData(userData.site, data);

	const { password, ...userWithoutPassword } = newUser;
	return userWithoutPassword;
}

export async function updateUser(
	userId: string,
	userData: {
		firstName?: string;
		lastName?: string;
		email?: string;
		password?: string;
		mobile?: string;
		role?: "admin" | "user";
		status?: "active" | "inactive";
		settings?: UserSettings;
		site: string;
	}
) {
	const data = await readSiteData(userData.site);

	const userIndex = data.users.findIndex((u: User) => u.id === userId);
	if (userIndex === -1) {
		throw new Error("User not found");
	}

	if (userData.email && userData.email !== data.users[userIndex].email) {
		const emailExists = data.users.some(
			(u: User) => u.id !== userId && u.email === userData.email
		);
		if (emailExists) {
			throw new Error("Email already exists");
		}
	}

	// Handle settings separately
	if (userData.settings) {
		await writeUserSettings(userData.site, userId, userData.settings);
		delete userData.settings;
	}

	const updatedUser = {
		...data.users[userIndex],
		...userData,
		updatedAt: new Date().toISOString(),
	};

	if (userData.password) {
		updatedUser.password = await bcrypt.hash(userData.password, 10);
	}

	data.users[userIndex] = updatedUser;
	await writeSiteData(userData.site, data);

	// Load updated settings
	const settings = await readUserSettings(userData.site, userId);
	const { password, ...userWithoutPassword } = updatedUser;
	return { ...userWithoutPassword, settings };
}

export async function deleteUser(userId: string, site: string) {
	const data = await readSiteData(site);

	const userIndex = data.users.findIndex((u: User) => u.id === userId);
	if (userIndex === -1) {
		throw new Error("User not found");
	}

	// Prevent deleting the last admin user
	const isAdmin = data.users[userIndex].role === "admin";
	if (isAdmin) {
		const adminCount = data.users.filter(
			(u: User) => u.role === "admin"
		).length;
		if (adminCount === 1) {
			throw new Error("Cannot delete the last admin user");
		}
	}

	data.users.splice(userIndex, 1);
	await writeSiteData(site, data);

	// Clean up user settings file
	try {
		// const dirPath = path.join(__dirname, "..", "data", "sites", site, "settings");
		// const filePath = path.join(dirPath, `${userId}.json`);
		// await fs.unlink(filePath);
	} catch (error) {
		// Ignore errors if settings file doesn't exist
	}
}
