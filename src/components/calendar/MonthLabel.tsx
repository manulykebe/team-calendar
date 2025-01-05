import { format } from "date-fns";

interface MonthLabelProps {
  date: Date;
}

export function MonthLabel({ date }: MonthLabelProps) {
  return (
    <span className="absolute top-1 left-1 text-xs font-medium text-zinc-400 pointer-events-none">
      {format(date, "MMMM")}
    </span>
  );
}