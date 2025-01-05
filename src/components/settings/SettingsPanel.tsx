import { useState } from "react";
import { Settings as SettingsIcon, X, Users, LogOut } from "lucide-react";
import { ColleagueSettings } from "./colleagues/ColleagueSettings";
import { UserManagement } from "../users/UserManagement";
import { useAuth } from "../../context/AuthContext";
import { ColleagueAvatar } from "./colleagues/ColleagueAvatar";
import { useUserSettings } from "./hooks/useUserSettings";
import { DisplaySettings } from "./DisplaySettings";

interface SettingsPanelProps {
	className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ className }) => {
	const { logout } = useAuth();
	const { currentUser, updateWorkStartDay } = useUserSettings();
	const [isOpen, setIsOpen] = useState(false);
	const [showColleagueSettings, setShowColleagueSettings] = useState(false);
	const [showUserManagement, setShowUserManagement] = useState(false);

	const handleLogout = () => {
		logout();
		setIsOpen(false);
	};

	return (
		<div className={`${className} settings-panel`}>
			<button
				onClick={() => setIsOpen(true)}
				className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
				aria-label="Open Settings"
			>
				<SettingsIcon className="w-4 h-4 mr-2" />
				Settings
			</button>

			{isOpen && (
				<div
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
					onClick={() => setIsOpen(false)}
				/>
			)}

			<div
				className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				} flex flex-col`}
			>
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold text-zinc-900">
						Settings
					</h2>
					<button
						onClick={() => setIsOpen(false)}
						className="p-2 text-zinc-500 hover:text-zinc-700 rounded-full transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 p-4 overflow-y-auto">
					<div className="space-y-6">
						<div>
							<h3 className="text-sm font-medium text-zinc-900 mb-2">
								Colleagues
							</h3>
							<div className="space-y-2">
								<button
									onClick={() => setShowUserManagement(true)}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Users className="w-4 h-4 mr-2" />
									Manage Users
								</button>
								<button
									onClick={() =>
										setShowColleagueSettings(true)
									}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Users className="w-4 h-4 mr-2" />
									Manage Colleague Display
								</button>
							</div>
						</div>

						<DisplaySettings
							currentUser={currentUser}
							onWorkStartChange={updateWorkStartDay}
						/>

						<div>
							<h3 className="text-sm font-medium text-zinc-900 mb-2">
								Theme
							</h3>
							<select className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
								<option>Light</option>
								<option>Dark</option>
								<option>System</option>
							</select>
						</div>
					</div>
				</div>

				{currentUser && (
					<div className="mt-auto border-t p-4">
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
									<p className="text-sm font-medium text-zinc-900">
										{currentUser.firstName}{" "}
										{currentUser.lastName}
									</p>
									<p className="text-xs text-zinc-500">
										{currentUser.email}
									</p>
								</div>
							</div>
							<button
								onClick={handleLogout}
								className="p-2 text-zinc-500 hover:text-zinc-700 rounded-full transition-colors"
								aria-label="Logout"
							>
								<LogOut className="w-5 h-5" />
							</button>
						</div>
					</div>
				)}
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
