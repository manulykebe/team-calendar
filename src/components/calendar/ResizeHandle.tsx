import { GripVertical } from "lucide-react";

interface ResizeHandleProps {
  position: 'left' | 'right';
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

export function ResizeHandle({ position, onMouseDown, isResizing }: ResizeHandleProps) {
  return (
    <div
      className={`absolute ${position}-0 top-0 bottom-0 w-2 cursor-ew-resize 
        ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
        transition-opacity`}
      onMouseDown={onMouseDown}
    >
      <div className={`absolute top-1/2 -translate-y-1/2 
        ${position === 'left' ? '-translate-x-1/2' : 'translate-x-1/2'}
        flex items-center justify-center w-4 h-4 rounded 
        ${isResizing ? 'bg-blue-100 border-blue-400' : 'bg-white/90 border-zinc-200'}
        shadow-sm border`}
      >
        <GripVertical className={`w-3 h-3 ${isResizing ? 'text-blue-600' : 'text-zinc-400'}`} />
      </div>
    </div>
  );
}