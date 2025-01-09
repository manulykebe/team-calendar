interface WeekDayHeaderProps {
  weekDays: string[];
}

export function WeekDayHeader({ weekDays }: WeekDayHeaderProps) {
  return (
    <div className="grid grid-cols-7 gap-px border-b border-zinc-200">
      {weekDays.map((day) => (
        <div
          key={day}
          className="bg-zinc-50 py-2 text-center text-sm font-semibold text-zinc-700"
        >
          {day}
        </div>
      ))}
    </div>
  );
}