import { User } from "../../../types/user";
import { ColleagueAvatar } from "./ColleagueAvatar";
import { ColorPicker } from "./ColorPicker";
import { AbbreviationInput } from "./AbbreviationInput";

interface ColleagueListItemProps {
	colleague: User;
	settings: {
		color: string;
		initials: string;
	};
	colors: string[];
	onColorChange: (id: string, color: string) => void;
	onAbbrevChange: (id: string, initials: string) => void;
}

export function ColleagueListItem({
	colleague,
	settings,
	colors,
	onColorChange,
	onAbbrevChange,
}: ColleagueListItemProps) {
	return (
		<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
			<div className="flex items-center space-x-4">
				<ColleagueAvatar
					firstName={colleague.firstName}
					lastName={colleague.lastName}
					color={settings.color}
					abbreviation={settings.initials}
				/>
				<div>
					<h3 className="font-medium">
						{colleague.firstName} {colleague.lastName}
					</h3>
					<p className="text-sm text-gray-500">{colleague.email}</p>
				</div>
			</div>

			<div className="flex items-center space-x-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Abbreviation
					</label>
					<AbbreviationInput
						value={settings.initials}
						onChange={(value) =>
							onAbbrevChange(colleague.id, value)
						}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Color
					</label>
					<ColorPicker
						colors={colors}
						selectedColor={settings.color}
						onChange={(color) => onColorChange(colleague.id, color)}
					/>
				</div>
			</div>
		</div>
	);
}
