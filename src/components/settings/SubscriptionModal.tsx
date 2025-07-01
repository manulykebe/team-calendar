import { useState, useEffect } from "react";
import { X, Copy, Check, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../../src/lib/api/config";
import { useTranslation } from "../../context/TranslationContext";

interface SubscriptionModalProps {
	userId: string;
	site: string;
	onClose: () => void;
}

type Tab = "outlook" | "google" | "apple" | "other";

export function SubscriptionModal({
	userId,
	site,
	onClose,
}: SubscriptionModalProps) {
	const { t } = useTranslation();
	const { token } = useAuth();
	const [subscriptionUrl, setSubscriptionUrl] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab>("outlook");

	useEffect(() => {
		const fetchSubscriptionUrl = async () => {
			try {
				const response = await fetch(
					`${API_URL}/agenda/${site}/${userId}/subscribe`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				if (!response.ok) {
					const failedMsg = t('subscription.failedToFetchUrl');
					throw new Error(
						Array.isArray(failedMsg)
							? failedMsg[0] || ''
							: failedMsg || ''
					);
				}

				const data = await response.json();
				setSubscriptionUrl(data.subscriptionUrl);
			} catch (err) {
				const fallbackMsg = t('errors.somethingWentWrong');
				setError(
					err instanceof Error
						? err.message
						: Array.isArray(fallbackMsg)
							? fallbackMsg[0] || ''
							: fallbackMsg || ''
				);
			} finally {
				setLoading(false);
			}
		};

		fetchSubscriptionUrl();
	}, [site, userId, token, t]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(subscriptionUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy URL:", err);
		}
	};

	const TabButton = ({ tab, label }: { tab: Tab; label: string }) => (
		<button
			onClick={() => setActiveTab(tab)}
			className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${activeTab === tab
					? "bg-blue-100 text-blue-700"
					: "text-zinc-600 hover:bg-zinc-100"
				}`}
		>
			{label}
		</button>
	);

	const TabContent = ({ tab }: { tab: Tab }) => {
		const instructions = t(`subscription.${tab}Instructions`, { returnObjects: true });
		
		// Ensure instructions is an array before mapping
		const instructionItems = Array.isArray(instructions) ? instructions : [];
		
		return (
			<ol className="list-decimal list-inside space-y-0 ml-4">
				{instructionItems.map((instruction, index) => (
					<li key={index}>{instruction}</li>
				))}
			</ol>
		);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
				<div className="flex justify-between items-center p-6 border-b">
					<div className="flex items-center space-x-2">
						<Calendar className="w-6 h-6 text-blue-600" />
						<h2 className="text-xl font-semibold text-zinc-900">
							{t('subscription.calendarSubscription')}
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-zinc-400 hover:text-zinc-500"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="p-6 space-y-2">
					{error ? (
						<div className="p-4 bg-red-50 text-red-600 rounded-md">
							{error}
						</div>
					) : loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					) : (
						<>
							<div className="space-y-4">
								<h3 className="text-lg font-medium text-zinc-900">
									{t('subscription.subscribeToYourCalendar')}
								</h3>
								<p className="text-zinc-600">
									{t('subscription.subscriptionInstructions')}
								</p>

								<div className="flex items-center space-x-2">
									<input
										type="text"
										value={subscriptionUrl}
										readOnly
										className="flex-1 p-2 border rounded-md bg-zinc-50 text-zinc-700 font-mono text-sm"
									/>
									<button
										onClick={handleCopy}
										className="p-2 text-blue-600 hover:text-blue-700 rounded-md border border-blue-200 hover:bg-blue-50"
										title={t('subscription.copyUrl')}
									>
										{copied ? (
											<Check className="w-5 h-5" />
										) : (
											<Copy className="w-5 h-5" />
										)}
									</button>
								</div>
							</div>

							<div className="space-y-2">
								<div className="border-b">
									<div className="flex space-x-2">
										<TabButton
											tab="outlook"
											label={t('subscription.outlook')}
										/>
										<TabButton
											tab="google"
											label={t('subscription.googleCalendar')}
										/>
										<TabButton
											tab="apple"
											label={t('subscription.appleCalendar')}
										/>
										<TabButton
											tab="other"
											label={t('subscription.otherApplications')}
										/>
									</div>
								</div>

								<div className="min-h-[220px] p-2">
									<h4 className="font-medium text-zinc-900 mb-4">
										{t('subscription.instructionsFor', {
											app: activeTab === "outlook"
												? t('subscription.outlook')
												: activeTab === "google"
													? t('subscription.googleCalendar')
													: activeTab === "apple"
														? t('subscription.appleCalendar')
														: t('subscription.otherApplications')
										})}
									</h4>
									<div className="text-zinc-600">
										<TabContent tab={activeTab} />
									</div>
								</div>
							</div>
						</>
					)}
				</div>

				<div className="flex justify-end space-x-3 p-6 border-t bg-zinc-50">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
					>
						{t('common.close')}
					</button>
				</div>
			</div>
		</div>
	);
}