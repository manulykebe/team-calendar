import { useRef } from 'react';
import { useClickOutside } from '../../../../hooks/useClickOutside';

interface AddScheduleDropdownProps {
  onAdd: (atStart: boolean) => void;
  onClose: () => void;
}

export function AddScheduleDropdown({ onAdd, onClose }: AddScheduleDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, onClose);

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 z-50"
    >
      <div className="p-2">
        <h3 className="text-sm font-medium text-zinc-900 mb-2">Add Schedule</h3>
        <button
          onClick={() => {
            onAdd(true);
            onClose();
          }}
          className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-md"
        >
          Add at start
        </button>
        <button
          onClick={() => {
            onAdd(false);
            onClose();
          }}
          className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-md"
        >
          Add at end
        </button>
      </div>
    </div>
  );
}