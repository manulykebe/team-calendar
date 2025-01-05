import { X } from "lucide-react";
import { ColleagueAvatar } from "./ColleagueAvatar";
import { ColorPicker } from "./ColorPicker";
import { AbbreviationInput } from "./AbbreviationInput";
import { useColleagueSettings } from "../../../hooks/useColleagueSettings";

interface ColleagueSettingsProps {
	onClose: () => void;
}

export function ColleagueSettings({ onClose }: ColleagueSettingsProps) {
	const {
		colleagues,
		loading,
		error,
		updateSettings,
		getColleagueSettings,
		DEFAULT_COLORS,
	} = useColleagueSettings();

	const handleColorChange = async (colleagueId: string, color: string) => {
		try {
			await updateSettings(colleagueId, { color });
		} catch (err) {
			console.error("Failed to update color:", err);
		}
	};

	const handleAbbrevChange = async (
		colleagueId: string,
		initials: string
	) => {
		try {
			await updateSettings(colleagueId, { initials });
		} catch (err) {
			console.error("Failed to update abbreviation:", err);
		}
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
				<div className="bg-white rounded-lg p-6">
					<div className="animate-pulse">Loading colleagues...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
				<div className="flex justify-between items-center p-6 border-b">
					<h2 className="text-xl font-semibold text-zinc-900">
						Colleague Display Settings
					</h2>
					<button
						onClick={onClose}
						className="text-zinc-400 hover:text-zinc-500"
						aria-label="Close"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{error && (
					<div className="p-4 text-red-600 bg-red-50 border-l-4 border-red-500">
						{error}
					</div>
				)}

				<div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
					{colleagues.map((colleague) => {
						const settings = getColleagueSettings(colleague.id);
						return (
							<div
								key={colleague.id}
								className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg"
							>
								<div className="flex items-center space-x-4">
									<ColleagueAvatar
										firstName={colleague.firstName}
										lastName={colleague.lastName}
										color={settings.color}
										abbreviation={settings.initials}
									/>
									<div>
										<h3 className="font-medium">
											{colleague.firstName}{" "}
											{colleague.lastName}
										</h3>
										<p className="text-sm text-zinc-500">
											{colleague.email}
										</p>
									</div>
								</div>

								<div className="flex items-center space-x-4">
									<div>
										<label className="block text-sm font-medium text-zinc-700 mb-1">
											Abbreviation
										</label>
										<AbbreviationInput
											value={settings.initials || ""}
											onChange={(value) =>
												handleAbbrevChange(
													colleague.id,
													value
												)
											}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-zinc-700 mb-1">
											Color
										</label>
										<ColorPicker
											colors={DEFAULT_COLORS}
											selectedColor={settings.color}
											onChange={(color) =>
												handleColorChange(
													colleague.id,
													color
												)
											}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
