import { format } from "date-fns";

interface MonthLabelProps {
  date: Date;
}

export function MonthLabel({ date }: MonthLabelProps) {
  return (
    <span className="absolute -top-0.5 -left-0.5 text-xs font-medium text-zinc-400 pointer-events-none">
      {format(date, "MMMM")}
    </span>
  );
}