import { Eye, EyeOff, GripVertical } from "lucide-react";
import { ColorGrid } from "./ColorGrid";
import { EditableAvatar } from "./EditableAvatar";
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
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-zinc-50 rounded-lg gap-4 ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="cursor-move">
          <GripVertical className="w-5 h-5 text-zinc-400" />
        </div>
        <EditableAvatar
          firstName={colleague.firstName}
          lastName={colleague.lastName}
          color={settings.color}
          abbreviation={settings.initials}
          size="lg"
          onInitialsChange={(value) => onAbbrevChange(colleague.id, value)}
        />
        <div className="min-w-[200px]">
          <h3 className="font-medium text-lg">
            {colleague.firstName} {colleague.lastName}
          </h3>
          <p className="text-sm text-zinc-500">{colleague.email}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
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

        <ColorGrid
          colors={colors}
          selectedColor={settings.color}
          onChange={(color) => onColorChange(colleague.id, color)}
        />
      </div>
    </div>
  );
}