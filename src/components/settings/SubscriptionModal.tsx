import { useState, useEffect } from "react";
import { X, Copy, Check, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../../src/lib/api/config";

interface SubscriptionModalProps {
	userId: string;
	site: string;
	onClose: () => void;
}

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
	debugger;
	useEffect(() => {
		const fetchSubscriptionUrl = async () => {
			try {
				const response = await fetch(`${API_URL}/agenda/${site}/${userId}/subscribe`,
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

				<div className="p-6 space-y-6">
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

							<div className="space-y-4">
								<h4 className="font-medium text-zinc-900">
									Instructions
								</h4>
								<div className="space-y-2 text-zinc-600">
									<p className="font-medium">For Outlook:</p>
									<ol className="list-decimal list-inside space-y-1 ml-4">
										<li>Copy the URL above</li>
										<li>
											In Outlook, right-click on Calendar
										</li>
										<li>
											Select "Add Calendar" &gt; "From
											Internet"
										</li>
										<li>Paste the URL and click "OK"</li>
									</ol>

									<p className="font-medium mt-4">
										For Google Calendar:
									</p>
									<ol className="list-decimal list-inside space-y-1 ml-4">
										<li>Copy the URL above</li>
										<li>Open Google Calendar</li>
										<li>
											Click the "+" next to "Other
											calendars"
										</li>
										<li>Select "From URL"</li>
										<li>
											Paste the URL and click "Add
											calendar"
										</li>
									</ol>

									<p className="font-medium mt-4">
										For Apple Calendar:
									</p>
									<ol className="list-decimal list-inside space-y-1 ml-4">
										<li>Copy the URL above</li>
										<li>Open Calendar app</li>
										<li>
											Select File &gt; "New Calendar
											Subscription"
										</li>
										<li>
											Paste the URL and click "Subscribe"
										</li>
									</ol>
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
