import { useState } from "react";
import {
	Settings as SettingsIcon,
	X,
	Users,
	LogOut,
	Clock,
	Calendar,
	Download,
	Shield,
	FileText
} from "lucide-react";
import { ColleagueSettings } from "./colleagues/ColleagueSettings";
import { UserManagement } from "../users/UserManagement";
import { PeriodManagementModal } from "../admin/PeriodManagementModal";
import { useAuth } from "../../context/AuthContext";
import { ColleagueAvatar } from "./colleagues/ColleagueAvatar";
import { useUserSettings } from "./hooks/useUserSettings";
import { DisplaySettings } from "./DisplaySettings";
import { LanguageSettings } from "./LanguageSettings";
import { AvailabilityModal } from "./availability/AvailabilityModal";
import { CalendarReport } from "./availability/CalendarReport";
import { SubscriptionModal } from "./SubscriptionModal";
import { ExportModal } from "./ExportModal";
import { useTranslation } from "../../context/TranslationContext";

interface SettingsPanelProps {
	className?: string;
}

export function SettingsPanel({ }: SettingsPanelProps) {
	const { logout } = useAuth();
	const { t } = useTranslation();
	const { currentUser, updateWorkStartDay, updateWeekNumberSetting } =
		useUserSettings();
	const [isOpen, setIsOpen] = useState(false);
	const [showColleagueSettings, setShowColleagueSettings] = useState(false);
	const [showUserManagement, setShowUserManagement] = useState(false);
	const [showPeriodManagement, setShowPeriodManagement] = useState(false);
	const [showAvailability, setShowAvailability] = useState(false);
	const [showCalendarReport, setShowCalendarReport] = useState(false);
	const [showSubscription, setShowSubscription] = useState(false);
	const [showExport, setShowExport] = useState(false);

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

	const handleOpenCalendarReport = () => {
		if (currentUser) {
			setShowCalendarReport(true);
			setIsOpen(false);
		}
	};

	const handleCloseCalendarReport = () => {
		setShowCalendarReport(false);
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

	const handleOpenExport = () => {
		if (currentUser) {
			setShowExport(true);
			setIsOpen(false);
		}
	};

	const handleCloseExport = () => {
		setShowExport(false);
		setIsOpen(true);
	};

	const handleOpenPeriodManagement = () => {
		if (currentUser) {
			setShowPeriodManagement(true);
			setIsOpen(false);
		}
	};

	const handleClosePeriodManagement = () => {
		setShowPeriodManagement(false);
		setIsOpen(true);
	};

	const isAdmin = currentUser?.role === 'admin';

	return (
		<div data-tsx-id="settings-panel">
			<button
				onClick={() => setIsOpen(true)}
				className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 z-10"
				aria-label={t('common.settings')}
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
				className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
					} flex flex-col`}
			>
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold text-zinc-900">
						{t('settings.settings')}
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
							<div className="space-y-2">
								<button
									onClick={handleOpenAvailability}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Clock className="w-4 h-4 mr-2" />
									{t('availability.setAvailability')}
								</button>
								<button
									onClick={handleOpenCalendarReport}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<FileText className="w-4 h-4 mr-2" />
									{t('availability.viewCalendarReport')}
								</button>
								<button
									onClick={handleOpenSubscription}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Calendar className="w-4 h-4 mr-2" />
									{t('settings.subscribeToCalendar')}
								</button>
								<button
									onClick={handleOpenExport}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Download className="w-4 h-4 mr-2" />
									{t('settings.exportEvents')}
								</button>
							</div>
						</div>

						{isAdmin && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-zinc-900 mb-2">
									{t('settings.admin')}
								</h3>
								<button
									onClick={() => setShowUserManagement(true)}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Users className="w-4 h-4 mr-2" />
									{t('settings.manageUsers')}
								</button>
								<button
									onClick={() =>
										setShowColleagueSettings(true)
									}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Users className="w-4 h-4 mr-2" />
									{t('settings.manageColleagueDisplay')}
								</button>
								<button
									onClick={handleOpenPeriodManagement}
									className="flex items-center w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
								>
									<Shield className="w-4 h-4 mr-2" />
									{t('settings.definePeriods')}
								</button>
							</div>
						)}

						<DisplaySettings
							currentUser={currentUser}
							onWorkStartChange={updateWorkStartDay}
							onWeekNumberChange={updateWeekNumberSetting}
						/>

						<LanguageSettings />
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
								aria-label={t('auth.signOut')}
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

			{showPeriodManagement && (
				<PeriodManagementModal
					onClose={handleClosePeriodManagement}
				/>
			)}

			{showAvailability && currentUser && (
				<AvailabilityModal
					colleague={currentUser}
					onClose={handleCloseAvailability}
				/>
			)}

			{showCalendarReport && currentUser && (
				<CalendarReport
					colleague={currentUser}
					year={new Date().getFullYear().toString()}
					onClose={handleCloseCalendarReport}
				/>
			)}

			{showSubscription && currentUser && (
				<SubscriptionModal
					userId={currentUser.id}
					site={currentUser.site}
					onClose={handleCloseSubscription}
				/>
			)}

			{showExport && currentUser && (
				<ExportModal
					userId={currentUser.id}
					site={currentUser.site}
					onClose={handleCloseExport}
				/>
			)}
		</div>
	);
}