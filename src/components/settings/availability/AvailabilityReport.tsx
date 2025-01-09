import { format, parse, getMonth } from 'date-fns';
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
  // Group dates by month
  const monthlyData = Object.entries(data.availability).reduce((acc, [date, slots]) => {
    const month = getMonth(parse(date, 'yyyy-MM-dd', new Date()));
    if (!acc[month]) {
      acc[month] = {};
    }
    acc[month][date] = slots;
    return acc;
  }, {} as { [key: number]: typeof data.availability });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-auto">
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

        <div className="p-6 space-y-8">
          {months.map((monthName, monthIndex) => (
            <div key={monthName} className="space-y-2">
              <h3 className="text-lg font-medium text-zinc-900">{monthName}</h3>
              <div className="grid grid-cols-8 gap-1 text-sm">
                <div className="col-span-1"></div>
                {[...Array(31)].map((_, i) => (
                  <div key={i} className="text-center font-medium">
                    {i + 1}
                  </div>
                ))}
                
                {data.dayParts.map(part => (
                  <div key={part} className="grid grid-cols-32 col-span-8">
                    <div className="col-span-1 font-medium text-right pr-2">
                      {part.toUpperCase()}
                    </div>
                    {[...Array(31)].map((_, day) => {
                      const date = format(
                        new Date(parseInt(data.year), monthIndex, day + 1),
                        'yyyy-MM-dd'
                      );
                      const availability = monthlyData[monthIndex]?.[date];
                      
                      if (!availability) return <div key={day} />;

                      return (
                        <div
                          key={day}
                          className={`h-6 ${
                            availability[part]
                              ? 'bg-green-100 border border-green-300'
                              : 'bg-red-100 border border-red-300'
                          } rounded`}
                          title={`${date} ${part}: ${availability[part] ? 'Available' : 'Unavailable'}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}