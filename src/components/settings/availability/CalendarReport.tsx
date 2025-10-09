import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "../../../context/TranslationContext";
import { useHolidays, isPublicHoliday } from "../../../context/HolidayContext";
import { getCalendarReport, CalendarReportData, CalendarReportDay } from "../../../lib/api/calendar-report";
import { User } from "../../../types";

interface CalendarReportProps {
  colleague: User;
  year: string;
  onClose: () => void;
}

export function CalendarReport({ colleague, year, onClose }: CalendarReportProps) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { holidays, loadHolidays } = useHolidays();
  const [reportData, setReportData] = useState<CalendarReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getCalendarReport(
          token,
          colleague.site,
          colleague.id,
          year
        );
        setReportData(data);
        loadHolidays(parseInt(year));
      } catch (err) {
        console.error("Error fetching calendar report:", err);
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token, colleague.id, colleague.site, year, loadHolidays]);

  const dayHeadersMap = useMemo(() => ({
    'Monday': t('days.mon'),
    'Tuesday': t('days.tue'),
    'Wednesday': t('days.wed'),
    'Thursday': t('days.thu'),
    'Friday': t('days.fri'),
    'Saturday': t('days.sat'),
    'Sunday': t('days.sun')
  }), [t]);

  const getDayHeaders = (weekStartsOn: string) => {
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startIndex = dayOrder.indexOf(weekStartsOn);
    const orderedDays = [...dayOrder.slice(startIndex), ...dayOrder.slice(0, startIndex)];
    return orderedDays.map(day => dayHeadersMap[day as keyof typeof dayHeadersMap]);
  };

  const getAvailabilityLabel = (day: CalendarReportDay) => {
    const date = new Date(day.date);

    if (isPublicHoliday(date, holidays)) {
      return t('calendar.holiday');
    }

    const isWeekend = day.dayOfWeek === 'Saturday' || day.dayOfWeek === 'Sunday';
    if (isWeekend) {
      return '';
    }

    const { am, pm } = day.availability;

    if (!am && !pm) {
      return t('calendar.unavailable');
    }

    if (am && pm) {
      return '';
    }

    if (am) {
      return t('availability.am');
    }

    if (pm) {
      return t('availability.pm');
    }

    return '';
  };

  const formatDateDisplay = (day: CalendarReportDay, prevDay: CalendarReportDay | null) => {
    const monthNames = [
      t('months.january'), t('months.february'), t('months.march'),
      t('months.april'), t('months.may'), t('months.june'),
      t('months.july'), t('months.august'), t('months.september'),
      t('months.october'), t('months.november'), t('months.december')
    ];

    const monthChanged = !prevDay || prevDay.month !== day.month;
    const yearChanged = !prevDay || prevDay.year !== day.year;

    if (yearChanged) {
      return `${day.day} ${monthNames[day.month - 1]} ${day.year}`;
    }

    if (monthChanged) {
      return `${day.day} ${monthNames[day.month - 1]}`;
    }

    return `${day.day}`;
  };

  const getCellBackgroundColor = (day: CalendarReportDay) => {
    const date = new Date(day.date);
    const isWeekend = day.dayOfWeek === 'Saturday' || day.dayOfWeek === 'Sunday';
    const isHoliday = isPublicHoliday(date, holidays);

    if (isHoliday) {
      return 'bg-red-50';
    }

    if (isWeekend) {
      return 'bg-zinc-100';
    }

    return 'bg-white';
  };

  const getCellTextColor = (day: CalendarReportDay) => {
    const date = new Date(day.date);
    const isWeekend = day.dayOfWeek === 'Saturday' || day.dayOfWeek === 'Sunday';
    const isHoliday = isPublicHoliday(date, holidays);
    const { am, pm } = day.availability;

    if (isHoliday) {
      return 'text-red-700 font-semibold';
    }

    if (isWeekend) {
      return 'text-zinc-500';
    }

    if (!am && !pm) {
      return 'text-red-700 font-medium';
    }

    return 'text-zinc-900';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">{t('common.error')}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-500">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-zinc-600">{error || t('errors.failedToLoadData')}</p>
        </div>
      </div>
    );
  }

  const dayHeaders = getDayHeaders(reportData.weekStartsOn);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-labelledby="calendar-report-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b">
          <h2 id="calendar-report-title" className="text-xl font-semibold text-zinc-900">
            {t('availability.availabilityReportFor', {
              name: reportData.userName,
              year: reportData.year
            })}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={t('common.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-zinc-300" role="table" aria-label="Calendar report table">
              <thead>
                <tr>
                  <th
                    className="border border-zinc-300 bg-zinc-100 p-3 text-left font-semibold text-zinc-900 sticky left-0 z-20"
                    scope="col"
                  >
                    {t('calendar.weekNumber').replace(' {{number}}', '')}
                  </th>
                  {dayHeaders.map((day, index) => (
                    <th
                      key={index}
                      className="border border-zinc-300 bg-zinc-100 p-3 text-center font-semibold text-zinc-900 min-w-[100px]"
                      scope="col"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.weeks.map((week, weekIndex) => (
                  <tr key={week.weekNumber}>
                    <td
                      className="border border-zinc-300 bg-zinc-50 p-3 text-center font-medium text-zinc-700 sticky left-0 z-10"
                      scope="row"
                    >
                      {week.weekNumber}
                    </td>
                    {week.days.map((day, dayIndex) => {
                      const prevDay = dayIndex > 0 ? week.days[dayIndex - 1] :
                                      weekIndex > 0 ? reportData.weeks[weekIndex - 1].days[6] : null;
                      const dateDisplay = formatDateDisplay(day, prevDay);
                      const availabilityLabel = getAvailabilityLabel(day);
                      const bgColor = getCellBackgroundColor(day);
                      const textColor = getCellTextColor(day);

                      return (
                        <td
                          key={day.date}
                          className={`border border-zinc-300 p-3 text-center ${bgColor}`}
                        >
                          <div className={`text-sm font-medium ${textColor}`}>
                            {dateDisplay}
                          </div>
                          {availabilityLabel && (
                            <div className="text-xs mt-1 text-zinc-600" aria-label={`Status: ${availabilityLabel}`}>
                              {availabilityLabel}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <h3 className="font-semibold text-zinc-900">{t('common.legend') || 'Legend'}:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white border border-zinc-300 rounded flex items-center justify-center text-xs font-bold">
                  15
                </div>
                <span className="text-zinc-700">{t('calendar.available')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white border border-zinc-300 rounded flex items-center justify-center text-xs font-bold text-red-700">
                  15
                </div>
                <span className="text-zinc-700">{t('calendar.unavailable')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-zinc-100 border border-zinc-300 rounded flex items-center justify-center text-xs font-bold text-zinc-500">
                  15
                </div>
                <span className="text-zinc-700">{t('calendar.weekend')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-50 border border-zinc-300 rounded flex items-center justify-center text-xs font-bold text-red-700">
                  15
                </div>
                <span className="text-zinc-700">{t('calendar.holiday')}</span>
              </div>
            </div>
            <div className="text-xs text-zinc-600 mt-4">
              <p>{t('availability.am')}: {t('availability.morning')}</p>
              <p>{t('availability.pm')}: {t('availability.afternoon')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
