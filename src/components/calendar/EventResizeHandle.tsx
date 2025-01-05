import { GripVertical } from "lucide-react";

interface EventResizeHandleProps {
  position: "left" | "right";
  onMouseDown: (e: React.MouseEvent) => void;
}

export function EventResizeHandle({ position, onMouseDown }: EventResizeHandleProps) {
  return (
    <div
      className={`absolute top-0 bottom-0 ${
        position === "left" ? "left-0" : "right-0"
      } w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity`}
      onMouseDown={onMouseDown}
      role="button"
      aria-label={`${position} resize handle`}
    >
      <div className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 -mx-1 rounded bg-white/90 shadow-sm border border-zinc-200">
        <GripVertical className="w-3 h-3 text-zinc-400" />
      </div>
    </div>
  );
}