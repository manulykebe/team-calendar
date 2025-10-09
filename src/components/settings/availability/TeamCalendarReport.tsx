import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "../../../context/TranslationContext";
import { useHolidays, isPublicHoliday } from "../../../context/HolidayContext";
import { getTeamCalendarReport, TeamCalendarReportData, TeamCalendarReportDay } from "../../../lib/api/team-calendar-report";
import { useApp } from "../../../context/AppContext";

interface TeamCalendarReportProps {
  year: string;
  onClose: () => void;
}

export function TeamCalendarReport({ year, onClose }: TeamCalendarReportProps) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const { holidays, loadHolidays } = useHolidays();
  const [reportData, setReportData] = useState<TeamCalendarReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!token || !currentUser) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getTeamCalendarReport(
          token,
          currentUser.site,
          year
        );
        setReportData(data);
        loadHolidays(parseInt(year));
      } catch (err) {
        console.error("Error fetching team calendar report:", err);
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token, currentUser, year, loadHolidays]);

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

  const formatDateDisplay = (day: TeamCalendarReportDay, prevDay: TeamCalendarReportDay | null) => {
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

  const getAbsentStaff = (day: TeamCalendarReportDay, period: 'am' | 'pm') => {
    const date = new Date(day.date);
    const isWeekend = day.dayOfWeek === 'Saturday' || day.dayOfWeek === 'Sunday';
    const isHoliday = isPublicHoliday(date, holidays);

    if (isWeekend || isHoliday) {
      return [];
    }

    return day.staffAvailability.filter(staff => !staff.availability[period]);
  };

  const getUnavailableStaffIds = (day: TeamCalendarReportDay): Set<string> => {
    const date = new Date(day.date);
    const isWeekend = day.dayOfWeek === 'Saturday' || day.dayOfWeek === 'Sunday';
    const isHoliday = isPublicHoliday(date, holidays);

    if (isWeekend || isHoliday) {
      return new Set();
    }

    const unavailableStaff = day.staffAvailability.filter(staff =>
      !staff.availability.am && !staff.availability.pm
    );

    return new Set(unavailableStaff.map(s => s.userId));
  };

  const getCellBackgroundColor = (day: TeamCalendarReportDay) => {
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
      aria-labelledby="team-calendar-report-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b">
          <h2 id="team-calendar-report-title" className="text-xl font-semibold text-zinc-900">
            Team Availability Report - {reportData.year}
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
            <table className="w-full border-collapse border border-zinc-300" role="table">
              <thead>
                <tr>
                  <th className="border border-zinc-300 bg-zinc-100 p-3 text-left font-semibold text-zinc-900 sticky left-0 z-20" scope="col">
                    {t('calendar.weekNumber').replace(' {{number}}', '')}
                  </th>
                  {dayHeaders.map((day, index) => (
                    <th key={index} className="border border-zinc-300 bg-zinc-100 p-3 text-center font-semibold text-zinc-900 min-w-[120px]" scope="col">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.weeks.map((week, weekIndex) => (
                  <tr key={week.weekNumber}>
                    <td className="border border-zinc-300 bg-zinc-50 p-3 text-center font-medium text-zinc-700 sticky left-0 z-10" scope="row">
                      {week.weekNumber}
                    </td>
                    {week.days.map((day, dayIndex) => {
                      const prevDay = dayIndex > 0 ? week.days[dayIndex - 1] : weekIndex > 0 ? reportData.weeks[weekIndex - 1].days[6] : null;
                      const dateDisplay = formatDateDisplay(day, prevDay);
                      const bgColor = getCellBackgroundColor(day);
                      const absentAM = getAbsentStaff(day, 'am');
                      const absentPM = getAbsentStaff(day, 'pm');
                      const unavailableIds = getUnavailableStaffIds(day);

                      return (
                        <td key={day.date} className={`border border-zinc-300 p-2 ${bgColor} align-top`}>
                          <div className="text-sm font-medium text-zinc-900 mb-2 text-center">
                            {dateDisplay}
                          </div>
                          <div className="space-y-1.5 min-h-[60px]">
                            {absentAM.length > 0 && (
                              <div className="text-xs">
                                <div className="font-semibold text-zinc-700 mb-1">AM:</div>
                                <div className="flex flex-wrap gap-1">
                                  {absentAM.map(staff => {
                                    const isUnavailable = unavailableIds.has(staff.userId);
                                    return (
                                      <span
                                        key={`${staff.userId}-am`}
                                        className="inline-flex items-center px-2 py-1 rounded text-white text-xs font-bold shadow-sm"
                                        style={{ backgroundColor: staff.color }}
                                        title={`${staff.firstName} ${staff.lastName}${isUnavailable ? ' - Onbeschikbaar (entire day)' : ' - Verlof (morning only)'}`}
                                      >
                                        {staff.initials}{isUnavailable && <span className="ml-0.5">*</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {absentPM.length > 0 && (
                              <div className="text-xs">
                                <div className="font-semibold text-zinc-700 mb-1">PM:</div>
                                <div className="flex flex-wrap gap-1">
                                  {absentPM.map(staff => {
                                    const isUnavailable = unavailableIds.has(staff.userId);
                                    return (
                                      <span
                                        key={`${staff.userId}-pm`}
                                        className="inline-flex items-center px-2 py-1 rounded text-white text-xs font-bold shadow-sm"
                                        style={{ backgroundColor: staff.color }}
                                        title={`${staff.firstName} ${staff.lastName}${isUnavailable ? ' - Onbeschikbaar (entire day)' : ' - Verlof (afternoon only)'}`}
                                      >
                                        {staff.initials}{isUnavailable && <span className="ml-0.5">*</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-4 text-sm bg-zinc-50 p-4 rounded-lg border border-zinc-200">
            <h3 className="font-bold text-zinc-900 text-base">Legend:</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-7 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  AB
                </div>
                <div className="flex-1">
                  <span className="text-zinc-900 font-bold">Verlof (Leave)</span>
                  <p className="text-xs text-zinc-700 mt-0.5">
                    Staff member absent for that specific time period only (AM or PM). May be available during the other period.
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 italic">
                    Example: "AB" in AM period means available in PM
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 border-t pt-3">
                <div className="flex-shrink-0 w-10 h-7 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  AB*
                </div>
                <div className="flex-1">
                  <span className="text-zinc-900 font-bold">Onbeschikbaar (Unavailable)</span>
                  <p className="text-xs text-zinc-700 mt-0.5">
                    Staff member with asterisk (*) is unavailable for the <strong>entire day</strong> (both AM and PM). Complete absence for that date.
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 italic">
                    Example: "AB*" appears in both AM and PM when fully unavailable
                  </p>
                </div>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-16 h-6 bg-red-50 border border-red-300 rounded flex items-center justify-center text-xs">
                    Holiday
                  </div>
                  <span className="text-zinc-700">Public holiday</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-16 h-6 bg-zinc-100 border border-zinc-300 rounded flex items-center justify-center text-xs">
                    Weekend
                  </div>
                  <span className="text-zinc-700">Weekend day</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-zinc-700 mt-4 bg-white p-3 rounded border border-zinc-200">
              <p className="font-semibold mb-2">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Empty cells</strong> = All staff available for that period</li>
                <li><strong>Colored labels</strong> = Each label is one absent staff member</li>
                <li><strong>AM/PM separation</strong> = Morning and afternoon shown separately</li>
                <li><strong>Asterisk (*)</strong> = Complete unavailability (full day)</li>
                <li><strong>No asterisk</strong> = Partial absence (verlof for specific period)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
