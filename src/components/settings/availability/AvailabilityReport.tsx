import { format, getMonth, getDay, getWeek } from 'date-fns';
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


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
              {dayHeaders.map((day, i) => (
                <div 
                  key={`header-${i}`}
                  className="text-center font-medium p-2 text-xs"
                >
                  {day}
                </div>
              ))}
              {/* Repeat headers for remaining weeks */}
              {dayHeaders.map((day, i) => (
                <div 
                  key={`header-2-${i}`}
                  className="text-center font-medium p-2 text-xs"
                >
                  {day}
                </div>
              ))}
              {dayHeaders.map((day, i) => (
                <div 
                  key={`header-3-${i}`}
                  className="text-center font-medium p-2 text-xs"
                >
                  {day}
                </div>
              ))}
              {dayHeaders.map((day, i) => (
                <div 
                  key={`header-4-${i}`}
                  className="text-center font-medium p-2 text-xs"
                >
                  {day}
                </div>
              ))}
              {dayHeaders.map((day, i) => (
                <div 
                  key={`header-5-${i}`}
                  className="text-center font-medium p-2 text-xs"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month rows */}
            {months.map((monthName, monthIndex) => {
              const firstDayOfMonth = new Date(parseInt(data.year), monthIndex, 1);
              const firstDayWeekday = getDay(firstDayOfMonth);
              const adjustedWeekday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

              return (
                <div key={monthName} className="grid grid-cols-[100px_repeat(37,1fr)] border-b">
                  <div className="p-2 font-medium">{monthName}</div>
                  {Array(37).fill(0).map((_, index) => {
                    const dayOffset = index - adjustedWeekday;
                    const currentDate = new Date(firstDayOfMonth);
                    currentDate.setDate(1 + dayOffset);
                    
                    if (getMonth(currentDate) !== monthIndex) {
                      return <div key={index} className="p-2" />;
                    }

                    const dateStr = format(currentDate, 'yyyy-MM-dd');
                    const dayData = data.availability[dateStr];
                    const dayOfWeek = getDay(currentDate);
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const weekNumber = getWeek(currentDate);
                    const isEvenWeek = weekNumber % 2 === 0;

                    return (
                      <div
                        key={index}
                        className={`p-1 border-r border-zinc-100 ${
                          isEvenWeek ? 'bg-zinc-500' : ''
                        }`}
                        title={format(currentDate, 'MMMM d, yyyy')}
                      >
                        <div className="text-xs text-center">
                          {format(currentDate, 'd')}
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {data.dayParts.map(part => (
                            <div
                              key={part}
                              className={`h-1 ${
                                dayData?.[part]
                                  ? 'bg-green-500'
                                  : isWeekend
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