import { format, parse, getMonth, getDay } from 'date-fns';
import { X } from 'lucide-react';

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
}

export function AvailabilityReport({ data, onClose }: AvailabilityReportProps) {
  const dayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group dates by month
  const monthlyData = Object.entries(data.availability).reduce((acc, [date, slots]) => {
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    const month = getMonth(parsedDate);
    const dayOfWeek = getDay(parsedDate);
    // Adjust for Sunday being 0
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    if (!acc[month]) {
      acc[month] = Array(31).fill(null).map(() => Array(7).fill(null));
    }
    
    const dayOfMonth = parsedDate.getDate() - 1; // 0-based index
    acc[month][dayOfMonth][adjustedDayOfWeek] = { date, slots, dayOfMonth: parsedDate.getDate() };
    
    return acc;
  }, {} as { [key: number]: Array<Array<{ date: string; slots: any; dayOfMonth: number } | null>> });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-[1200px] w-full max-h-[90vh] overflow-auto">
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
          <div className="grid grid-cols-[100px_1fr] gap-4">
            {/* Header row with day names */}
            <div></div>
            <div className="grid grid-cols-7 gap-1">
              {dayHeaders.map(day => (
                <div key={day} className="text-center font-medium border-b pb-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Month rows */}
            {months.map((monthName, monthIndex) => {
              const monthData = monthlyData[monthIndex];
              if (!monthData) return null;

              return (
                <div key={monthName} className="contents">
                  <div className="text-left font-medium py-2">{monthName}</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array(7).fill(0).map((_, dayOfWeek) => (
                      <div key={dayOfWeek} className="space-y-1">
                        {monthData.map((week, weekIndex) => {
                          const dayData = week[dayOfWeek];
                          if (!dayData) return null;

                          return (
                            <div
                              key={dayData.date}
                              className="text-center p-1 border rounded text-xs"
                              title={format(parse(dayData.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
                            >
                              <div className="font-medium mb-0.5">{dayData.dayOfMonth}</div>
                              <div className="space-y-0.5">
                                {data.dayParts.map(part => (
                                  <div
                                    key={part}
                                    className={`h-1 ${
                                      dayData.slots[part]
                                        ? 'bg-green-500'
                                        : dayOfWeek >= 5
                                          ? 'bg-zinc-200'
                                          : 'bg-red-500'
                                    } rounded-sm`}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center space-x-6 text-sm">
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
        </div>
      </div>
    </div>
  );
}