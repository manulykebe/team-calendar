import { useState, useEffect } from "react";
import { X, Copy, Check, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../../src/lib/api/config";

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
					throw new Error("Failed to fetch subscription URL");
				}

				const data = await response.json();
				setSubscriptionUrl(data.subscriptionUrl);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "An error occurred"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchSubscriptionUrl();
	}, [site, userId, token]);

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
        ${
			activeTab === tab
				? "bg-blue-100 text-blue-700"
				: "text-zinc-600 hover:bg-zinc-100"
		}`}
		>
			{label}
		</button>
	);

	const TabContent = ({ tab }: { tab: Tab }) => {
		switch (tab) {
			case "outlook":
				return (
					<ol className="list-decimal list-inside space-y-0 ml-4">
						<li>Open Outlook Desktop or Outlook Web</li>
						<li>Right-click on Calendar in the navigation pane</li>
						<li>Select "Add Calendar" → "From Internet"</li>
						<li>Paste the subscription URL</li>
						<li>Click "OK" or "Save"</li>
						<li>
							Choose how often you want Outlook to sync the
							calendar
						</li>
						<li>Click "Yes" to add the calendar</li>
					</ol>
				);
			case "google":
				return (
					<ol className="list-decimal list-inside space-y-0 ml-4">
						<li>Open Google Calendar in your browser</li>
						<li>
							On the left side, find "Other calendars" and click
							the "+" button
						</li>
						<li>Select "From URL" from the dropdown menu</li>
						<li>Paste the subscription URL in the "URL" field</li>
						<li>Click "Add calendar"</li>
						<li>
							The calendar will appear under "Other calendars" in
							your calendar list
						</li>
					</ol>
				);
			case "apple":
				return (
					<ol className="list-decimal list-inside space-y-0 ml-4">
						<li>Open the Calendar app on your Mac</li>
						<li>From the menu bar, select File</li>
						<li>Choose "New Calendar Subscription"</li>
						<li>Paste the subscription URL</li>
						<li>Click "Subscribe"</li>
						<li>
							Configure sync frequency and other options as needed
						</li>
						<li>Click "OK" to finish</li>
						<p className="mt-4 text-sm text-zinc-600">
							For iOS devices:
						</p>
						<li>Go to Settings → Calendar → Accounts</li>
						<li>
							Tap "Add Account" → "Other" → "Add Subscribed
							Calendar"
						</li>
						<li>Paste the subscription URL</li>
						<li>Tap "Next" and then "Save"</li>
					</ol>
				);
			case "other":
				return (
					<div className="space-y-4">
						<p>
							For other calendar applications that support
							webcal:// or HTTP(S) calendar subscriptions:
						</p>
						<ol className="list-decimal list-inside space-y-0 ml-4">
							<li>
								Look for an option to add a calendar
								subscription or "Subscribe to Calendar"
							</li>
							<li>
								When prompted, paste the subscription URL
								provided above
							</li>
							<li>
								Configure sync frequency if the option is
								available
							</li>
							<li>Save or confirm the subscription</li>
						</ol>
						<p className="mt-4 text-sm text-zinc-600">
							Note: The calendar uses the iCalendar (.ics) format,
							which is compatible with most modern calendar
							applications.
						</p>
					</div>
				);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
				<div className="flex justify-between items-center p-6 border-b">
					<div className="flex items-center space-x-2">
						<Calendar className="w-6 h-6 text-blue-600" />
						<h2 className="text-xl font-semibold text-zinc-900">
							Calendar Subscription
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
									Subscribe to Your Calendar
								</h3>
								<p className="text-zinc-600">
									Use this URL to subscribe to your calendar
									in your preferred calendar application:
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
										title="Copy URL"
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
											label="Outlook"
										/>
										<TabButton
											tab="google"
											label="Google Calendar"
										/>
										<TabButton
											tab="apple"
											label="Apple Calendar"
										/>
										<TabButton
											tab="other"
											label="Other Apps"
										/>
									</div>
								</div>

								<div className="min-h-[220px] p-2">
									<h4 className="font-medium text-zinc-900 mb-4">
										Instructions for{" "}
										{activeTab === "outlook"
											? "Microsoft Outlook"
											: activeTab === "google"
												? "Google Calendar"
												: activeTab === "apple"
													? "Apple Calendar"
													: "Other Applications"}
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
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
