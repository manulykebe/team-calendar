import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationControlsProps {
  currentEntryIndex: number;
  totalEntries: number;
  onPrevEntry: () => void;
  onNextEntry: () => void;
}

export function NavigationControls({
  currentEntryIndex,
  totalEntries,
  onPrevEntry,
  onNextEntry,
}: NavigationControlsProps) {
  const isFirstEntry = currentEntryIndex === 0;
  const isLastEntry = currentEntryIndex === totalEntries - 1;
  const hasEntries = totalEntries > 0;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onPrevEntry}
        disabled={!hasEntries || isFirstEntry}
        className={`p-1 rounded hover:bg-zinc-100 ${
          (!hasEntries || isFirstEntry) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Previous schedule"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <span className="text-sm font-medium min-w-[48px] text-center">
        {hasEntries ? `${currentEntryIndex + 1}/${totalEntries}` : "..."}
      </span>
      
      <button
        onClick={onNextEntry}
        disabled={!hasEntries || isLastEntry}
        className={`p-1 rounded hover:bg-zinc-100 ${
          (!hasEntries || isLastEntry) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Next schedule"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}