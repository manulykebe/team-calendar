import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Sun, Moon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { User } from "../../../types/user";
import { WeeklySchedule, TimeSlot } from "../../../types/availability";
import { updateUser } from "../../../lib/api";
import { getAvailabilityReport } from "../../../lib/api/report";
import { updateAvailabilityException } from "../../../lib/api/users";
import { useAuth } from "../../../context/AuthContext";
import { AvailabilityReport } from "./AvailabilityReport";

interface AvailabilityModalProps {
  colleague: User;
  onClose: () => void;
}

type RepeatPattern = "all" | "evenodd";

export function AvailabilityModal({
  colleague,
  onClose,
}: AvailabilityModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentEntryIndex, setCurrentEntryIndex] = useState(-1);
  const [availability, setAvailability] = useState<any[]>(
    colleague.settings?.availability || []
  );
  const [startDate, setStartDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState("");
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>("all");
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    const defaultSchedule = {
      Monday: { am: true, pm: true },
      Tuesday: { am: true, pm: true },
      Wednesday: { am: true, pm: true },
      Thursday: { am: true, pm: true },
      Friday: { am: true, pm: true },
      Saturday: { am: false, pm: false },
      Sunday: { am: false, pm: false },
    };
    return defaultSchedule;
  });
  const [alternateSchedule, setAlternateSchedule] = useState<WeeklySchedule>(
    () => {
      return { ...schedule };
    }
  );

  // Report states
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportYear, setReportYear] = useState(
    new Date().getFullYear().toString()
  );

  useEffect(() => {
    if (currentEntryIndex >= 0 && currentEntryIndex < availability.length) {
      const entry = availability[currentEntryIndex];
      setStartDate(entry.startDate);
      setEndDate(entry.endDate || "");
      setRepeatPattern(entry.repeatPattern || "all");
      setSchedule(entry.weeklySchedule);
      if (entry.alternateWeekSchedule) {
        setAlternateSchedule(entry.alternateWeekSchedule);
      }
    }
  }, [currentEntryIndex, availability]);

  const handleTimeSlotToggle = (
    day: keyof WeeklySchedule,
    slot: keyof TimeSlot,
    isAlternate = false
  ) => {
    const setterFunction = isAlternate ? setAlternateSchedule : setSchedule;
    setterFunction((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: !prev[day][slot],
      },
    }));
  };

  const handlePrevEntry = () => {
    if (currentEntryIndex > -1) {
      setCurrentEntryIndex(currentEntryIndex - 1);
    }
  };

  const handleNextEntry = () => {
    if (currentEntryIndex < availability.length - 1) {
      setCurrentEntryIndex(currentEntryIndex + 1);
    } else if (currentEntryIndex === -1 && availability.length > 0) {
      setCurrentEntryIndex(0);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      let newAvailability = [...availability];
      const newEntry = {
        weeklySchedule: schedule,
        ...(repeatPattern === "evenodd" && {
          alternateWeekSchedule: alternateSchedule,
        }),
        startDate,
        endDate,
        repeatPattern,
      };

      if (currentEntryIndex === -1) {
        newAvailability.push(newEntry);
      } else {
        newAvailability[currentEntryIndex] = newEntry;
      }

      // Sort availability entries by start date
      newAvailability.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      const updatedSettings = {
        ...colleague.settings,
        availability: newAvailability,
      };

      await updateUser(token, colleague.id, {
        settings: updatedSettings,
      });

      setAvailability(newAvailability);
      setCurrentEntryIndex(-1);
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setEndDate("");
      setRepeatPattern("all");
      setSchedule({
        Monday: { am: true, pm: true },
        Tuesday: { am: true, pm: true },
        Wednesday: { am: true, pm: true },
        Thursday: { am: true, pm: true },
        Friday: { am: true, pm: true },
        Saturday: { am: false, pm: false },
        Sunday: { am: false, pm: false },
      });
      setAlternateSchedule({
        Monday: { am: true, pm: true },
        Tuesday: { am: true, pm: true },
        Wednesday: { am: true, pm: true },
        Thursday: { am: true, pm: true },
        Friday: { am: true, pm: true },
        Saturday: { am: false, pm: false },
        Sunday: { am: false, pm: false },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save availability"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");
      const data = await getAvailabilityReport(
        token,
        colleague.site,
        colleague.id,
        reportYear
      );
      setReportData(data);
      setShowReport(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch availability report"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExceptionToggle = async (date: string, part: 'am' | 'pm', value: boolean) => {
    if (!token) return;

    try {
      await updateAvailabilityException(token, colleague.id, {
        date,
        part,
        value
      });

      // Refresh report data
      const updatedData = await getAvailabilityReport(
        token,
        colleague.site,
        colleague.id,
        reportYear
      );
      setReportData(updatedData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update exception"
      );
    }
  };

  const renderScheduleGrid = (isAlternate = false) => (
    <div className="grid grid-cols-6 gap-4">
      <div className="col-span-1"></div>
      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
        <div key={day} className="text-center font-medium">
          {day}
        </div>
      ))}

      <div className="flex items-center justify-end">
        <Sun className="w-5 h-5 text-amber-500" />
      </div>
      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
        <div
          key={`${day}-am${isAlternate ? "-alt" : ""}`}
          className="text-center"
        >
          <button
            onClick={() =>
              handleTimeSlotToggle(
                day as keyof WeeklySchedule,
                "am",
                isAlternate
              )
            }
            className={`w-full h-12 rounded-md border ${
              (isAlternate ? alternateSchedule : schedule)[day as keyof WeeklySchedule]
                .am
                ? "bg-green-100 border-green-500"
                : "bg-red-100 border-red-500"
            }`}
          >
            {(isAlternate ? alternateSchedule : schedule)[day as keyof WeeklySchedule]
              .am
              ? "Available"
              : "Unavailable"}
          </button>
        </div>
      ))}

      <div className="flex items-center justify-end">
        <Moon className="w-5 h-5 text-blue-500" />
      </div>
      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
        <div
          key={`${day}-pm${isAlternate ? "-alt" : ""}`}
          className="text-center"
        >
          <button
            onClick={() =>
              handleTimeSlotToggle(
                day as keyof WeeklySchedule,
                "pm",
                isAlternate
              )
            }
            className={`w-full h-12 rounded-md border ${
              (isAlternate ? alternateSchedule : schedule)[day as keyof WeeklySchedule]
                .pm
                ? "bg-green-100 border-green-500"
                : "bg-red-100 border-red-500"
            }`}
          >
            {(isAlternate ? alternateSchedule : schedule)[day as keyof WeeklySchedule]
              .pm
              ? "Available"
              : "Unavailable"}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-zinc-900">
              Set Availability for {colleague.firstName}{" "}
              {colleague.lastName}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 text-red-600 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-2 flex items-center space-x-2">
                <button
                  onClick={handlePrevEntry}
                  disabled={currentEntryIndex === -1}
                  className="p-1 rounded hover:bg-zinc-100 disabled:opacity-50"
                  title="Previous entry"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium">
                  {currentEntryIndex === -1 ? "New" : `${currentEntryIndex + 1}/${availability.length}`}
                </span>
                <button
                  onClick={handleNextEntry}
                  disabled={currentEntryIndex === -1 && availability.length === 0}
                  className="p-1 rounded hover:bg-zinc-100 disabled:opacity-50"
                  title="Next entry"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border-zinc-300"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full rounded-md border-zinc-300"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Repeat Pattern
                </label>
                <select
                  value={repeatPattern}
                  onChange={(e) =>
                    setRepeatPattern(e.target.value as RepeatPattern)
                  }
                  className="w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Weeks</option>
                  <option value="evenodd">Even/Odd Weeks</option>
                </select>
              </div>
            </div>

            <div className="space-y-8">
              {repeatPattern === "evenodd" && (
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 mb-4">
                    Even Weeks
                  </h3>
                  {renderScheduleGrid(false)}
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium text-zinc-900 mb-4">
                  {repeatPattern === "all"
                    ? "Weekly Schedule"
                    : "Odd Weeks"}
                </h3>
                {renderScheduleGrid(repeatPattern === "evenodd")}
              </div>
            </div>
          </div>

          <div className="flex justify-between space-x-3 p-6 border-t">
            <div className="flex items-center space-x-2">
              <select
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className="rounded-md border-zinc-300"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleViewReport}
                disabled={loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                View Report
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReport && reportData && (
        <AvailabilityReport
          data={reportData}
          onClose={() => setShowReport(false)}
          onExceptionToggle={handleExceptionToggle}
        />
      )}
    </>
  );
}