import express, { Request, Response } from "express";
import cors from "cors";
import jwt, { verify } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { readSiteData, writeSiteData } from "./utils";
import crypto from "crypto";

// Extend the Request interface to include the user property
declare module "express-serve-static-core" {
	interface Request {
		user?: jwt.JwtPayload | string;
	}
}
import { User, Event } from "./types";

const app = express();
const JWT_SECRET = "your-secret-key"; // In production, use environment variable

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
);
app.use(express.json());

// Add type guard
function isValidToken(token: string | undefined): token is string {
	return typeof token === "string" && token.length > 0;
}

// Update verification function
const verifyToken = (token: string | undefined) => {
	if (!isValidToken(token)) {
		return null;
	}

	try {
		const decoded = verify(token, process.env.JWT_SECRET || "default_secret");
		return decoded;
	} catch (error) {
    console.error(error);
		return null;
	}
};

// Middleware to verify JWT token
const authenticateToken = (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!isValidToken(token)) {
		return res.status(401).json({ message: "Invalid token" });
	}

	const decoded = verifyToken(token);
	if (!decoded) {
		return res.status(401).json({ message: "Token verification failed" });
	}

	req.user = decoded;
	next();
};

app.post("/api/auth/register", async (req: Request, res: Response) => {
	try {
		const { firstName, lastName, email, mobile, password, site } = req.body;
		const data = await readSiteData(site);

		if (data.users.some((u: User) => u.email === email)) {
			return res.status(400).json({ message: "Email already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser: User = {
			id: crypto.randomUUID(),
			firstName,
			lastName,
			email,
			mobile,
			password: hashedPassword,
			site,
			role: data.users.length === 0 ? "admin" : "user",
		};

		data.users.push(newUser);
		await writeSiteData(site, data);

		const token = jwt.sign(
			{ id: newUser.id, email: newUser.email, site },
			JWT_SECRET
		);
		res.json({ token });
	} catch {
		res.status(500).json({ message: "Server error" });
	}
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
	try {
		const { email, password, site } = req.body;
		const data = await readSiteData(site);

		const user = data.users.find((u: User) => u.email === email);
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign(
			{ id: user.id, email: user.email, site },
			JWT_SECRET
		);
		res.json({ token });
	} catch (error) {
		res.status(500).json({ message: error || "Server error" });
	}
});

// Events routes
app.get(
	"/api/events",
	authenticateToken,
	async (req: Request, res: Response) => {
		try {
			const data = await readSiteData(req.user.site);
			res.json(data.events);
		} catch (error) {
			res.status(500).json({ message: error || "Server error" });
		}
	}
);

app.post(
	"/api/events",
	authenticateToken,
	async (req: Request, res: Response) => {
		try {
			const { title, description, date } = req.body;
			const data = await readSiteData(req.user.site);

			const newEvent: Event = {
				id: crypto.randomUUID(),
				userId: req.user.id,
				title,
				description,
				date,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			data.events.push(newEvent);
			await writeSiteData(req.user.site, data);
			res.json(newEvent);
		} catch (error) {
			res.status(500).json({ message: "Server error" });
		}
	}
);

app.put("/api/events/:id", authenticateToken, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { title, description, date } = req.body;
		const data = await readSiteData(req.user.site);

		const event = data.events.find((e: Event) => e.id === id);
		if (!event || event.userId !== req.user.id) {
			return res.status(403).json({ message: "Not authorized" });
		}

		Object.assign(event, {
			title,
			description,
			date,
			updatedAt: new Date().toISOString(),
		});

		await writeSiteData(req.user.site, data);
		res.json(event);
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
});

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;
		const data = await readSiteData(req.user.site);

		const eventIndex = data.events.findIndex((e: Event) => e.id === id);
		if (
			eventIndex === -1 ||
			data.events[eventIndex].userId !== req.user.id
		) {
			return res.status(403).json({ message: "Not authorized" });
		}

		data.events.splice(eventIndex, 1);
		await writeSiteData(req.user.site, data);
		res.sendStatus(204);
	} catch (error) {
		res.status(500).json({ message: error || "Server error" });
	}
});

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
