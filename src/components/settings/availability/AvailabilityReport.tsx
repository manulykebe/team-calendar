import { format, getMonth, getWeek, getDay } from "date-fns";
import { X } from "lucide-react";

interface AvailabilityReportProps {
  data: {
    year: string;
    userId: string;
    workWeekDays: string[];
    dayParts: string[];
    availability: {
      [key: string]: {
        am: boolean;
        pm: boolean;
      };
    };
  };
  onClose: () => void;
  onExceptionToggle?: (
    date: string,
    part: "am" | "pm",
    value: boolean,
  ) => Promise<void>;
}

export function AvailabilityReport({
  data,
  onClose,
  onExceptionToggle,
}: AvailabilityReportProps) {
  const dayHeaders = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Helper to convert Sunday=0 to Monday=0
  const getMondayBasedDay = (date: Date): number => {
    const day = getDay(date);
    return day === 0 ? 6 : day - 1;
  };

  // Custom week calculation starting from Monday
  const getCustomWeek = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const daysSinceFirstDay = Math.floor(
      (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    return (
      Math.floor((daysSinceFirstDay + getMondayBasedDay(firstDayOfYear)) / 7) +
      1
    );
  };

  const handleTimeSlotClick = async (
    dateStr: string,
    part: "am" | "pm",
    currentValue: boolean,
  ) => {
    if (onExceptionToggle) {
      await onExceptionToggle(dateStr, part, !currentValue);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      data-tsx-id="availability-report"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-[1400px] w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-zinc-900">
            Availability Report - {data.year}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="w-full">
            {/* Header row with day names */}
            <div className="grid grid-cols-[100px_repeat(37,1fr)] border-b">
              <div className="p-2"></div>
              {[...Array(5)].map((_, weekIndex) =>
                dayHeaders.map((day, i) => (
                  <div
                    key={`header-${weekIndex}-${i}`}
                    className="text-center font-medium p-2 text-xs"
                  >
                    {day}
                  </div>
                )),
              )}
            </div>

            {/* Month rows */}
            {months.map((monthName, monthIndex) => {
              const firstDayOfMonth = new Date(
                parseInt(data.year),
                monthIndex,
                1,
              );
              const adjustedWeekday = getMondayBasedDay(firstDayOfMonth);

              return (
                <div
                  key={monthName}
                  className="grid grid-cols-[100px_repeat(37,1fr)] border-b"
                >
                  <div className="p-2 font-medium">{monthName}</div>
                  {Array(37)
                    .fill(0)
                    .map((_, index) => {
                      const dayOffset = index - adjustedWeekday;
                      const currentDate = new Date(firstDayOfMonth);
                      currentDate.setDate(1 + dayOffset);

                      if (getMonth(currentDate) !== monthIndex) {
                        return <div key={index} className="p-2" />;
                      }

                      const dateStr = format(currentDate, "yyyy-MM-dd");
                      const dayData = data.availability[dateStr];
                      const dayOfWeek = getMondayBasedDay(currentDate);
                      const isWeekend = dayOfWeek >= 5; // 5=Sat, 6=Sun
                      const weekNumber = getCustomWeek(currentDate);
                      const isEvenWeek = weekNumber % 2 === 0;

                      return (
                        <div
                          key={index}
                          className={`p-1 border-r border-zinc-100 ${
                            isEvenWeek ? "bg-zinc-50" : ""
                          }`}
                          title={format(currentDate, "MMMM d, yyyy")}
                        >
                          <div className="text-xs text-center">
                            {format(currentDate, "d")}
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {data.dayParts.map((part) => (
                              <button
                                key={part}
                                onClick={() =>
                                  handleTimeSlotClick(
                                    dateStr,
                                    part as "am" | "pm",
                                    dayData?.[part],
                                  )
                                }
                                className={`h-1.5 w-full transition-colors cursor-pointer ${
                                  dayData?.[part]
                                    ? "bg-green-500 hover:bg-green-600"
                                    : isWeekend
                                      ? "bg-zinc-200"
                                      : "bg-red-500 hover:bg-red-600"
                                } rounded-sm`}
                                disabled={isWeekend}
                                title={`${format(currentDate, "MMM d")} ${part.toUpperCase()}`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>Unavailable</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-zinc-200 rounded" />
                <span>Weekend</span>
              </div>
            </div>
            {onExceptionToggle && (
              <div className="text-sm text-zinc-600">
                Click on time slots to toggle exceptions. Changes are saved
                automatically.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
