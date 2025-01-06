import { Eye, EyeOff, GripVertical } from "lucide-react";
import { ColleagueAvatar } from "./ColleagueAvatar";
import { ColorPicker } from "./ColorPicker";
import { AbbreviationInput } from "./AbbreviationInput";
import { useColleagueDrag } from "./hooks/useColleagueDrag";
import { ColleagueRowProps } from "./types";

export function ColleagueRow({
  colleague,
  settings,
  colors,
  onColorChange,
  onAbbrevChange,
  onVisibilityToggle,
  isVisible,
  index,
  moveColleague,
}: ColleagueRowProps) {
  const { isDragging, dragRef } = useColleagueDrag(colleague.id, index, moveColleague);

  return (
    <div
      ref={dragRef}
      className={`flex items-center justify-between p-6 bg-zinc-50 rounded-lg ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center space-x-6">
        <div className="cursor-move">
          <GripVertical className="w-5 h-5 text-zinc-400" />
        </div>
        <ColleagueAvatar
          firstName={colleague.firstName}
          lastName={colleague.lastName}
          color={settings.color}
          abbreviation={settings.initials}
          size="lg"
        />
        <div className="min-w-[200px]">
          <h3 className="font-medium text-lg">
            {colleague.firstName} {colleague.lastName}
          </h3>
          <p className="text-sm text-zinc-500">{colleague.email}</p>
        </div>
      </div>

      <div className="flex items-center space-x-8">
        <button
          onClick={() => onVisibilityToggle(colleague.id)}
          className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
          aria-label={isVisible ? "Hide colleague" : "Show colleague"}
        >
          {isVisible ? (
            <Eye className="w-5 h-5 text-zinc-600" />
          ) : (
            <EyeOff className="w-5 h-5 text-zinc-400" />
          )}
        </button>
        <div>

          <AbbreviationInput
            value={settings.initials}
            onChange={(value) => onAbbrevChange(colleague.id, value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
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