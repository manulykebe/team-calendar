import { useRef, useEffect } from "react";
import { useClickOutside } from "../../../../hooks/useClickOutside";

interface DeleteScheduleDropdownProps {
  isFirstSchedule: boolean;
  isMiddleSchedule: boolean;
  onDelete: (extendPreceding: boolean) => void;
  onClose: () => void;
}

export function DeleteScheduleDropdown({
  isFirstSchedule,
  isMiddleSchedule,
  onDelete,
  onClose,
}: DeleteScheduleDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, onClose);

  // Handle direct deletion for first schedule
  useEffect(() => {
    if (isFirstSchedule) {
      onDelete(false);
      onClose();
    }
  }, [isFirstSchedule, onDelete, onClose]);

  if (isFirstSchedule) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-zinc-200 z-50"
    >
      <div className="p-2">
        <h3 className="text-sm font-medium text-zinc-900 mb-2">
          Delete Schedule
        </h3>
        {isMiddleSchedule ? (
          <>
            <button
              onClick={() => {
                onDelete(true);
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-md"
            >
              Extend preceding schedule
            </button>
            <button
              onClick={() => {
                onDelete(false);
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-md"
            >
              Extend following schedule
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              onDelete(true);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-md"
          >
            Delete schedule
          </button>
        )}
      </div>
    </div>
  );
}
