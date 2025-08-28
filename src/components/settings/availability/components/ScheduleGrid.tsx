import { Sun, Moon } from "lucide-react";
import { WeeklySchedule, TimeSlot } from "../../../../types/availability";
import { useTranslation } from "../../../../context/TranslationContext";

interface ScheduleGridProps {
  caption: string;
  schedule: WeeklySchedule;
  isAlternate?: boolean;
  onTimeSlotToggle: (day: keyof WeeklySchedule, slot: keyof TimeSlot, isAlternate: boolean) => void;
  disabled?: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export function ScheduleGrid({
  caption,
  schedule,
  isAlternate = false,
  onTimeSlotToggle,
  disabled = false,
}: ScheduleGridProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`grid grid-cols-6 gap-4 ${disabled ? "opacity-50" : ""}`}
      data-tsx-id="schedule-grid"
    >
      <div className="col-span-1 text-center font-medium">{caption}</div>
      {DAYS.map((day) => (
        <div key={day} className="text-center font-medium">
          {t(`common.${day.toLowerCase()}`)}
        </div>
      ))}

      <div className="flex items-center justify-end">
        <Sun className="w-5 h-5 text-amber-500" />
      </div>
      {DAYS.map((day) => (
        <div key={`${day}-am`} className="text-center">
          <button
            onClick={() => onTimeSlotToggle(day, "am", isAlternate)}
            disabled={disabled}
            className={`w-full h-12 rounded-md border transition-colors duration-200 
              ${schedule[day]?.am
                ? "bg-green-100 border-green-500 hover:bg-green-200"
                : "bg-red-100 border-red-500 hover:bg-red-200"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
            aria-label={`Toggle ${day} morning availability`}
          >
            {schedule[day]?.am ? t('calendar.available') : t('calendar.unavailable')}
          </button>
        </div>
      ))}

      <div className="flex items-center justify-end">
        <Moon className="w-5 h-5 text-blue-500" />
      </div>
      {DAYS.map((day) => (
        <div key={`${day}-pm`} className="text-center">
          <button
            onClick={() => onTimeSlotToggle(day, "pm", isAlternate)}
            disabled={disabled}
            className={`w-full h-12 rounded-md border transition-colors duration-200 
              ${schedule[day]?.pm
                ? "bg-green-100 border-green-500 hover:bg-green-200"
                : "bg-red-100 border-red-500 hover:bg-red-200"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
            aria-label={`Toggle ${day} afternoon availability`}
          >
            {schedule[day]?.pm ? t('calendar.available') : t('calendar.unavailable')}
          </button>
        </div>
      ))}
    </div>
  );
}