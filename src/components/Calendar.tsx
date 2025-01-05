import { useState, useEffect } from "react";
import { Plus, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getEvents, createEvent, getUsers } from "../lib/api";
import { EventModal } from "./EventModal";
import { UserManagement } from "./users/UserManagement";
import { SettingsPanel } from "./settings/SettingsPanel";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { User } from "../types/user";
import { userSettingsEmitter } from "../hooks/useColleagueSettings";
import { useCalendarSettings } from "../hooks/useCalendarSettings";
import { format } from "date-fns";

export function Calendar() {
	const { token, logout } = useAuth();
	const { weekStartsOn } = useCalendarSettings();
	const [events, setEvents] = useState([]);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [showModal, setShowModal] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	const fetchEvents = async () => {
		if (!token) return;
		try {
			const eventsData = await getEvents(token);
			setEvents(eventsData);
		} catch (error) {
			console.error("Failed to fetch events:", error);
		}
	};

	useEffect(() => {
		if (token) {
			Promise.all([getEvents(token), getUsers(token)])
				.then(([eventsData, users]) => {
					setEvents(eventsData);
					const userEmail = localStorage.getItem("userEmail");
					const user = users.find((u) => u.email === userEmail);
					if (user) {
						setCurrentUser(user);
					}
				})
				.catch(console.error);

			const handleSettingsUpdate = ({
				userId,
				settings,
			}: {
				userId: string;
				settings: any;
			}) => {
				setCurrentUser((prev) =>
					prev && prev.id === userId ? { ...prev, settings } : prev
				);
			};

			userSettingsEmitter.on("settingsUpdated", handleSettingsUpdate);
			return () =>
				userSettingsEmitter.off(
					"settingsUpdated",
					handleSettingsUpdate
				);
		}
	}, [token]);

	const handleCreateEvent = async (eventData: {
		title: string;
		description: string;
	}) => {
		if (!token) return;

		try {
			const newEvent = await createEvent(token, {
				...eventData,
				date: format(selectedDate, "yyyy-MM-dd"),
			});
			setEvents([...events, newEvent]);
			setShowModal(false);
		} catch (error) {
			console.error("Failed to create event:", error);
		}
	};

	const handleEventDelete = (eventId: string) => {
		setEvents(events.filter((event) => event.id !== eventId));
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold text-zinc-900">
					Team Calendar
				</h1>
				<UserManagement />
				<div className="flex items-center gap-2">
					<button
						onClick={logout}
						className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
					>
						<LogOut className="w-4 h-4 mr-2" />
						Logout
					</button>
					<SettingsPanel />
				</div>
			</div>

			<div className="bg-white rounded-lg shadow">
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold text-zinc-900">
						{format(currentMonth, "MMMM yyyy")}
					</h2>
					<div className="flex space-x-2">
						<button
							onClick={() =>
								setCurrentMonth(
									new Date(
										currentMonth.setMonth(
											currentMonth.getMonth() - 1
										)
									)
								)
							}
							className="px-3 py-1 text-sm text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
						>
							Previous
						</button>
						<button
							onClick={() =>
								setCurrentMonth(
									new Date(
										currentMonth.setMonth(
											currentMonth.getMonth() + 1
										)
									)
								)
							}
							className="px-3 py-1 text-sm text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
						>
							Next
						</button>
					</div>
				</div>

				<CalendarGrid
					currentMonth={currentMonth}
					events={events}
					onDateClick={(date) => {
						setSelectedDate(date);
						setShowModal(true);
					}}
					weekStartsOn={weekStartsOn}
					userSettings={currentUser?.settings}
					onEventDelete={handleEventDelete}
					currentUser={currentUser}
				/>
			</div>

			<button
				onClick={() => {
					setSelectedDate(new Date());
					setShowModal(true);
				}}
				className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"
			>
				<Plus className="w-6 h-6" />
			</button>

			{showModal && (
				<EventModal
					date={selectedDate}
					onClose={() => setShowModal(false)}
					onSubmit={handleCreateEvent}
				/>
			)}
		</div>
	);
}
