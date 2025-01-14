import {
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

interface NavigationControlsProps {
  currentEntryIndex: number;
  totalEntries: number;
  onFirstEntry: () => void;
  onPrevEntry: () => void;
  onNextEntry: () => void;
  onLastEntry: () => void;
}

export function NavigationControls({
  currentEntryIndex,
  totalEntries,
  onFirstEntry,
  onPrevEntry,
  onNextEntry,
  onLastEntry,
}: NavigationControlsProps) {
  const isFirstEntry = currentEntryIndex === 0;
  const isLastEntry = currentEntryIndex === totalEntries - 1;
  const hasEntries = totalEntries > 0;

  return (
    <div className="flex items-center">
      <button
        onClick={onFirstEntry}
        disabled={!hasEntries || isFirstEntry}
        className={`rounded hover:bg-zinc-100 ${
          !hasEntries || isFirstEntry ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="First schedule"
      >
        <ChevronsLeft className="w-5 h-5" />
      </button>
      <button
        onClick={onPrevEntry}
        disabled={!hasEntries || isFirstEntry}
        className={`rounded hover:bg-zinc-100 ${
          !hasEntries || isFirstEntry ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Previous schedule"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium min-w-[36px] text-center">
        {hasEntries ? `${currentEntryIndex + 1}/${totalEntries}` : "..."}
      </span>
      <button
        onClick={onNextEntry}
        disabled={!hasEntries || isLastEntry}
        className={`rounded hover:bg-zinc-100 ${
          !hasEntries || isLastEntry ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Next schedule"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        onClick={onLastEntry}
        disabled={!hasEntries || isLastEntry}
        className={`rounded hover:bg-zinc-100 ${
          !hasEntries || isLastEntry ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Last schedule"
      >
        <ChevronsRight className="w-5 h-5" />
      </button>
    </div>
  );
}
