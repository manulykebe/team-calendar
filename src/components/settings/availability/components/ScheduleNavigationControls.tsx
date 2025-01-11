import { useState } from 'react';
import { Trash2, Plus, Scissors } from 'lucide-react';
import { DeleteScheduleDropdown } from './DeleteScheduleDropdown';
import { AddScheduleDropdown } from './AddScheduleDropdown';
import { SplitScheduleModal } from './SplitScheduleModal';

interface ScheduleNavigationControlsProps {
  currentEntryIndex: number;
  totalEntries: number;
  startDate: string;
  endDate: string;
  onDelete: (extendPreceding: boolean) => void;
  onAdd: (atStart: boolean) => void;
  onSplit: (splitDate: string) => void;
  disabled?: boolean;
}

export function ScheduleNavigationControls({
  currentEntryIndex,
  totalEntries,
  startDate,
  endDate,
  onDelete,
  onAdd,
  onSplit,
  disabled = false,
}: ScheduleNavigationControlsProps) {
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

  const isFirstSchedule = currentEntryIndex === 0;
  const isLastSchedule = currentEntryIndex === totalEntries - 1;
  const isMiddleSchedule = !isFirstSchedule && !isLastSchedule;

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <button
          onClick={() => setShowDeleteDropdown(true)}
          className={`p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Delete schedule"
          disabled={disabled}
        >
          <Trash2 className="w-5 h-5" />
        </button>
        {showDeleteDropdown && !disabled && (
          <DeleteScheduleDropdown
            isFirstSchedule={isFirstSchedule}
            isMiddleSchedule={isMiddleSchedule}
            onDelete={onDelete}
            onClose={() => setShowDeleteDropdown(false)}
          />
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowAddDropdown(true)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Add schedule"
        >
          <Plus className="w-5 h-5" />
        </button>
        {showAddDropdown && (
          <AddScheduleDropdown
            onAdd={onAdd}
            onClose={() => setShowAddDropdown(false)}
          />
        )}
      </div>

      <button
        onClick={() => setShowSplitModal(true)}
        className={`p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Split schedule"
        disabled={disabled || !endDate}
      >
        <Scissors className="w-5 h-5" />
      </button>

      {showSplitModal && !disabled && (
        <SplitScheduleModal
          startDate={startDate}
          endDate={endDate}
          onSplit={onSplit}
          onClose={() => setShowSplitModal(false)}
        />
      )}
    </div>
  );
}