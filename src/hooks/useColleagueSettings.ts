import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../lib/api/users";
import { updateUser } from "../lib/api/users";
import { User } from "../types/user";
import { EventEmitter } from "../utils/eventEmitter";

export const userSettingsEmitter = new EventEmitter();

export const DEFAULT_COLORS = [
	"#a50026",
	"#d73027",
	"#f46d43",
	"#fdae61",
	"#fee090",
	"#e0f3f8",
	"#abd9e9",
	"#74add1",
	"#4575b4",
	"#313695",
];

export function useColleagueSettings() {
	const { token } = useAuth();
	const [colleagues, setColleagues] = useState<User[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const fetchData = useCallback(async () => {
		if (!token) return;
		try {
			const users = await getUsers(token);
			const userEmail = localStorage.getItem("userEmail");
			const current = users.find((u: User) => u.email === userEmail);

			if (current) {
				setCurrentUser(current);
				
				// Filter out admin users from colleagues list
				const filteredColleagues = [
					current,
					...users.filter((u: User) => u.id !== current.id && u.role !== "admin"),
				];
				setColleagues(filteredColleagues);
			} else {
				throw new Error("Current user not found");
			}
		} catch (err) {
			setError("Failed to load colleagues");
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		fetchData();

		const handleAvailabilityChange = async ({
			userId,
			type,
			data,
		}: {
			userId: string;
			type: string;
			data: any;
		}) => {
			if (!token || !currentUser) return;
			if (type === "exception") {
				const { date, part, value } = data;
				const newSettings = {
					...currentUser.settings,
					availabilityExceptions: [
						...(currentUser.settings?.availabilityExceptions || []),
						{ date, [part]: value },
					],
				};

				try {
					await updateUser(token, userId, { settings: newSettings });
					setCurrentUser((prev) =>
						prev ? { ...prev, settings: newSettings } : null
					);
				} catch (err) {
					console.error(
						"Failed to update availability exception:",
						err
					);
				}
			}
		};

		userSettingsEmitter.on("availabilityChanged", handleAvailabilityChange);
		return () => {
			userSettingsEmitter.off(
				"availabilityChanged",
				handleAvailabilityChange
			);
		};
	}, [fetchData, token, currentUser]);

	const updateSettings = async (
		colleagueId: string,
		updates: {
			color?: string;
			initials?: string;
			visible?: boolean;
			colleagueOrder?: string[];
		}
	) => {
		if (!currentUser || !token) return;

		let newSettings;
		if (colleagueId === "order") {
			// Handle order update
			newSettings = {
				...currentUser.settings,
				colleagueOrder: updates.colleagueOrder,
			};
		} else {
			// Handle colleague-specific settings
			// Ensure both color and initials are always present
			const prev = currentUser.settings?.colleagues?.[colleagueId] || { color: undefined, initials: "", visible: undefined };
			const newColleagueSettings = {
				color: updates.color ?? prev.color ?? DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
				initials: updates.initials ?? prev.initials ?? "",
				visible: updates.visible !== undefined ? updates.visible : prev.visible,
			};

			newSettings = {
				...currentUser.settings,
				colleagues: {
					...currentUser.settings?.colleagues,
					[colleagueId]: newColleagueSettings,
				},
			};
		}

		try {
			await updateUser(token, currentUser.id, { settings: newSettings });
			setCurrentUser((prev) =>
				prev ? { ...prev, settings: newSettings } : null
			);

			userSettingsEmitter.emit("settingsUpdated", {
				userId: currentUser.id,
				settings: newSettings,
			});
		} catch (err) {
			setError("Failed to update settings");
			throw err;
		}
	};

	const getColleagueSettings = (colleagueId: string) => {
		return (
			currentUser?.settings?.colleagues?.[colleagueId] || {
				color: DEFAULT_COLORS[
					Math.floor(Math.random() * DEFAULT_COLORS.length)
				],
				initials: "",
			}
		);
	};

	return {
		colleagues,
		currentUser,
		loading,
		error,
		updateSettings,
		getColleagueSettings,
		DEFAULT_COLORS,
		refresh: fetchData,
	};
}