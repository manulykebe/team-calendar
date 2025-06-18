import { useTranslation } from "../../context/TranslationContext";
import { Tooltip } from "../common/Tooltip";

interface WeekDayHeaderProps {
  weekDays: string[];
}

export function WeekDayHeader({ weekDays }: WeekDayHeaderProps) {
  const { t } = useTranslation();
  
  // Map the English day abbreviations to translation keys
  const getDayTranslation = (day: string) => {
    const dayMap: Record<string, string> = {
      'Sun': 'days.sun',
      'Mon': 'days.mon',
      'Tue': 'days.tue',
      'Wed': 'days.wed',
      'Thu': 'days.thu',
      'Fri': 'days.fri',
      'Sat': 'days.sat',
    };
    
    return t(dayMap[day] || day);
  };

  // Get full day name for tooltip
  const getFullDayName = (day: string) => {
    const dayMap: Record<string, string> = {
      'Sun': 'settings.sunday',
      'Mon': 'settings.monday',
      'Tue': 'settings.tuesday',
      'Wed': 'settings.wednesday',
      'Thu': 'settings.thursday',
      'Fri': 'settings.friday',
      'Sat': 'settings.saturday',
    };
    
    return t(dayMap[day] || day);
  };

  return (
    <div
      className="grid grid-cols-7 gap-px border-b border-zinc-200"
      data-tsx-id="week-day-header"
    >
      {weekDays.map((day) => (
        <Tooltip key={day} content={getFullDayName(day)}>
          <div
            className="bg-zinc-50 py-2 text-center text-sm font-semibold text-zinc-700"
          >
            {getDayTranslation(day)}
          </div>
        </Tooltip>
      ))}
    </div>
  );
}