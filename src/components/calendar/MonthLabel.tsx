import { format } from "date-fns";
import { useTranslation } from "../../context/TranslationContext";

interface MonthLabelProps {
  date: Date;
}

export function MonthLabel({ date }: MonthLabelProps) {
  const { t } = useTranslation();
  
  // Map month number to translation key
  const getMonthTranslation = (date: Date) => {
    const monthIndex = date.getMonth();
    const monthKeys = [
      'months.january',
      'months.february',
      'months.march',
      'months.april',
      'months.may',
      'months.june',
      'months.july',
      'months.august',
      'months.september',
      'months.october',
      'months.november',
      'months.december'
    ];
    
    return t(monthKeys[monthIndex]);
  };

  return (
    <span className="absolute -top-0.5 -left-0.5 text-xs font-medium text-zinc-400 z-50">
      {getMonthTranslation(date)}
    </span>
  );
}