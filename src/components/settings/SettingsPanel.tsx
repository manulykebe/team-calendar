import { useState, useEffect } from "react";
import { Settings as SettingsIcon, X, Users, LogOut } from "lucide-react";
import { ColleagueSettings } from "./colleagues/ColleagueSettings";
import { UserManagement } from "../users/UserManagement";
import { useAuth } from "../../context/AuthContext";
import { getUsers } from "../../lib/api";
import { User } from "../../types/user";
import { ColleagueAvatar } from "./colleagues/ColleagueAvatar";
import { userSettingsEmitter } from "../../hooks/useColleagueSettings";

interface SettingsPanelProps {
	className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ className }) => {
	const { token, logout } = useAuth();
	const [isOpen, setIsOpen] = useState(false);
	const [showColleagueSettings, setShowColleagueSettings] = useState(false);
	const [showUserManagement, setShowUserManagement] = useState(false);
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	useEffect(() => {
		const fetchCurrentUser = async () => {
			if (!token) return;
			try {
				const users = await getUsers(token);
				const userEmail = localStorage.getItem("userEmail");
				const user = users.find((u) => u.email === userEmail);
				if (user) {
					setCurrentUser(user);
				}
			} catch (error) {
				console.error("Failed to fetch current user:", error);
			}
		};

		fetchCurrentUser();

		// Listen for settings updates
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

		return () => {
			userSettingsEmitter.off("settingsUpdated", handleSettingsUpdate);
		};
	}, [token]);

	const handleLogout = () => {
		logout();
		setIsOpen(false);
	};

	return (
		<div className={`${className} settings-panel`}>
			<button
				onClick={() => setIsOpen(true)}
				className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
				aria-label="Open Settings"
			>
				<SettingsIcon className="w-4 h-4 mr-2" />
				Settings
			</button>

			{/* Backdrop */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* Panel */}
			<div
				className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				} flex flex-col`}
			>
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold text-gray-900">
						Settings
					</h2>
					<button
						onClick={() => setIsOpen(false)}
						className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 p-4 overflow-y-auto">
					<div className="space-y-6">
						<div>
							<h3 className="text-sm font-medium text-gray-900 mb-2">
								Colleagues
							</h3>
							<div className="space-y-2">
								<button
									onClick={() => setShowUserManagement(true)}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
								>
									<Users className="w-4 h-4 mr-2" />
									Manage Users
								</button>
								<button
									onClick={() =>
										setShowColleagueSettings(true)
									}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
								>
									<Users className="w-4 h-4 mr-2" />
									Manage Colleague Display
								</button>
							</div>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-900 mb-2">
								Display
							</h3>
							<div className="space-y-2">
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										className="rounded border-gray-300 text-blue-600"
									/>
									<span className="text-sm text-gray-700">
										Show weekends
									</span>
								</label>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										className="rounded border-gray-300 text-blue-600"
									/>
									<span className="text-sm text-gray-700">
										Week starts on Monday
									</span>
								</label>
							</div>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-900 mb-2">
								Theme
							</h3>
							<select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
								<option>Light</option>
								<option>Dark</option>
								<option>System</option>
							</select>
						</div>
					</div>
				</div>

				{/* User Info and Logout Section */}
				<div className="mt-auto border-t p-4">
					{currentUser && (
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<ColleagueAvatar
									firstName={currentUser.firstName}
									lastName={currentUser.lastName}
									color={
										currentUser.settings?.colleagues?.[
											currentUser.id
										]?.color || "#a50026"
									}
									abbreviation={
										currentUser.settings?.colleagues?.[
											currentUser.id
										]?.initials
									}
									size="sm"
								/>
								<div className="ml-3">
									<p className="text-sm font-medium text-gray-900">
										{currentUser.firstName}{" "}
										{currentUser.lastName}
									</p>
									<p className="text-xs text-gray-500">
										{currentUser.email}
									</p>
								</div>
							</div>
							<button
								onClick={handleLogout}
								className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
								aria-label="Logout"
							>
								<LogOut className="w-5 h-5" />
							</button>
						</div>
					)}
				</div>
			</div>

			{showColleagueSettings && (
				<ColleagueSettings
					onClose={() => setShowColleagueSettings(false)}
				/>
			)}

			{showUserManagement && (
				<UserManagement onClose={() => setShowUserManagement(false)} />
			)}
		</div>
	);
};
