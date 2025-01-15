import { useState } from "react";
import {
	Settings as SettingsIcon,
	X,
	Users,
	LogOut,
	Clock,
	Calendar
} from "lucide-react";
import { ColleagueSettings } from "./colleagues/ColleagueSettings";
import { UserManagement } from "../users/UserManagement";
import { useAuth } from "../../context/AuthContext";
import { ColleagueAvatar } from "./colleagues/ColleagueAvatar";
import { useUserSettings } from "./hooks/useUserSettings";
import { DisplaySettings } from "./DisplaySettings";
import { AvailabilityModal } from "./availability/AvailabilityModal";
import { SubscriptionModal } from "./SubscriptionModal";

interface SettingsPanelProps {
	className?: string;
}

export function SettingsPanel({}: SettingsPanelProps) {
	const { logout } = useAuth();
	const { currentUser, updateWorkStartDay, updateWeekNumberSetting } =
		useUserSettings();
	const [isOpen, setIsOpen] = useState(false);
	const [showColleagueSettings, setShowColleagueSettings] = useState(false);
	const [showUserManagement, setShowUserManagement] = useState(false);
	const [showAvailability, setShowAvailability] = useState(false);
	const [showSubscription, setShowSubscription] = useState(false);

	const handleLogout = () => {
		logout();
		setIsOpen(false);
	};

	const handleOpenAvailability = () => {
		if (currentUser) {
			setShowAvailability(true);
			setIsOpen(false);
		}
	};

	const handleCloseAvailability = () => {
		setShowAvailability(false);
		setIsOpen(true);
	};

	const handleOpenSubscription = () => {
		if (currentUser) {
			setShowSubscription(true);
			setIsOpen(false);
		}
	};

	const handleCloseSubscription = () => {
		setShowSubscription(false);
		setIsOpen(true);
	};

	return (
		<div data-tsx-id="settings-panel">
			<button
				onClick={() => setIsOpen(true)}
				className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 z-10"
				aria-label="Open Settings"
			>
				<SettingsIcon className="w-6 h-6" />
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
								<button
									onClick={handleOpenAvailability}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Clock className="w-4 h-4 mr-2" />
									Set Availability
								</button>
								<button
									onClick={handleOpenSubscription}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Calendar className="w-4 h-4 mr-2" />
									Subscribe to Calendar
								</button>
							</div>
						</div>

						<DisplaySettings
							currentUser={currentUser}
							onWorkStartChange={updateWorkStartDay}
							onWeekNumberChange={updateWeekNumberSetting}
						/>
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

			{showAvailability && currentUser && (
				<AvailabilityModal
					colleague={currentUser}
					onClose={handleCloseAvailability}
				/>
			)}

			{showSubscription && currentUser && (
				<SubscriptionModal
					userId={currentUser.id}
					site={currentUser.site}
					onClose={handleCloseSubscription}
				/>
			)}
		</div>
	);
}