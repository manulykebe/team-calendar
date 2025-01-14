import { useState } from "react";
import { X, FileText, Trash2, Plus, Scissors } from "lucide-react";
import { User } from "../../../types/user";
import { useAuth } from "../../../context/AuthContext";
import { updateUserAvailabilitySchedule } from "../../../lib/api";
import { getAvailabilityReport } from "../../../lib/api/report";
import { AvailabilityReport } from "./AvailabilityReport";
import { useAvailabilityState } from "./hooks/useAvailabilityState";
import { useAvailabilityNavigation } from "./hooks/useAvailabilityNavigation";
import { useScheduleNavigation } from "./hooks/useScheduleNavigation";
import { NavigationControls } from "./components/NavigationControls";
import { ScheduleGrid } from "./components/ScheduleGrid";
import { Availability } from "../../../lib/api/types";
import { SplitScheduleModal } from "./components/SplitScheduleModal";
import toast from "react-hot-toast";

interface AvailabilityModalProps {
  colleague: User;
  onClose: () => void;
}

export function AvailabilityModal({ colleague, onClose }: AvailabilityModalProps) {
  const { token } = useAuth();
  if (!token) return null;

  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [showSplitModal, setShowSplitModal] = useState(false);

  const {
    loading,
    setLoading,
    error,
    setError,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    repeatPattern,
    setRepeatPattern,
    schedule,
    setSchedule,
    alternateSchedule,
    setAlternateSchedule,
    handleTimeSlotToggle,
  } = useAvailabilityState(colleague);

  const {
    currentEntryIndex,
    totalEntries,
    handleFirstEntry,
    handlePrevEntry,
    handleNextEntry,
    handleLastEntry,
  } = useAvailabilityNavigation({
    colleague,
    setStartDate,
    setEndDate,
    setRepeatPattern,
    setSchedule,
    setAlternateSchedule,
  });

  const { handleDelete, handleAdd, handleSplit } = useScheduleNavigation({
    token,
    colleague,
    currentEntryIndex,
    setCurrentEntryIndex: () => {},
    setStartDate,
    setEndDate,
    setSchedule,
    setAlternateSchedule,
    setError,
  });

  const handleViewReport = async () => {
    if (!token) return;

    const toastId = toast.loading('Loading report...');
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
      toast.success('Report loaded successfully', { id: toastId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch availability report";
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || currentEntryIndex === -1) return;

    const toastId = toast.loading('Saving changes...');
    try {
      setLoading(true);
      setError("");

      const availability: Availability = {
        weeklySchedule: schedule,
        ...(repeatPattern === "evenodd" && {
          alternateWeekSchedule: alternateSchedule,
        }),
        startDate,
        endDate,
        repeatPattern,
      };

      await updateUserAvailabilitySchedule(
        token,
        colleague.id,
        currentEntryIndex,
        availability
      );
      toast.success('Changes saved successfully', { id: toastId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save availability";
      setError(errorMessage);
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = (position: "start" | "end") => {
    try {
      handleAdd(position === "start");
      toast.success(`New schedule added ${position === "start" ? "at start" : "at end"}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add schedule";
      toast.error(errorMessage);
    }
  };

  const handleSplitSchedule = async (splitDate: string) => {
    try {
      await handleSplit(splitDate);
      setShowSplitModal(false);
      toast.success('Schedule split successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to split schedule";
      toast.error(errorMessage);
    }
  };

  const handleDeleteSchedule = async (extendPreceding: boolean) => {
    try {
      await handleDelete(extendPreceding);
      toast.success('Schedule deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete schedule";
      toast.error(errorMessage);
    }
  };

  const isNewEntry = currentEntryIndex === -1;
  const isFirstEntry = currentEntryIndex === 0;
  const isLastEntry = currentEntryIndex === totalEntries - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-zinc-900">
            Set Availability for {colleague.firstName} {colleague.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-2">
              <NavigationControls
                currentEntryIndex={currentEntryIndex}
                totalEntries={totalEntries}
                onFirstEntry={handleFirstEntry}
                onPrevEntry={handlePrevEntry}
                onNextEntry={handleNextEntry}
                onLastEntry={handleLastEntry}
                isNewEntry={isNewEntry}
              />
            </div>

            <div className="col-span-10 grid grid-cols-9 gap-2">
              <div className="p-2 col-span-3 border rounded-md border-zinc-300">
                <label className="block text-sm font-medium text-zinc-700 mb-0">
                  Start Date
                </label>
                <div className="flex-1 flex items-center">
                  <button
                    onClick={() => handleAddSchedule("start")}
                    className={`space-x-2 ${
                      isNewEntry || isFirstEntry
                        ? "text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        : "text-zinc-300 cursor-not-allowed hidden"
                    }`}
                    title="Add schedule before"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(true)}
                    className={`space-x-2 ${
                      isNewEntry || isFirstEntry
                        ? "text-zinc-300 cursor-not-allowed hidden"
                        : "text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    }`}
                    title="Merge with previous schedule"
                    disabled={isNewEntry || isFirstEntry}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-32 ${
                      isNewEntry ? "opacity-50 cursor-not-allowed hidden" : ""
                    }`}
                    disabled={isNewEntry}
                  />
                </div>
              </div>

              <div className="col-span-1 flex items-end justify-center">
                <button
                  onClick={() => setShowSplitModal(true)}
                  className={`p-2 text-zinc-600 hover:bg-purple-50 rounded-full transition-colors ${
                    isNewEntry || !endDate
                      ? "opacity-50 cursor-not-allowed hidden"
                      : ""
                  }`}
                  title="Split schedule"
                  disabled={isNewEntry || !endDate}
                >
                  <Scissors className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 col-span-3 border rounded-md border-zinc-300">
                <label className="block text-sm font-medium text-zinc-700 mb-0">
                  End Date
                </label>
                <div className="flex-1 flex items-center">
                  <button
                    onClick={() => handleDeleteSchedule(false)}
                    className={`space-x-2 ${
                      isNewEntry || isLastEntry
                        ? "text-zinc-300 cursor-not-allowed hidden"
                        : "text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    }`}
                    title="Merge with next schedule"
                    disabled={isNewEntry || isLastEntry}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleAddSchedule("end")}
                    className={`space-x-2 ${
                      isNewEntry || isLastEntry
                        ? "text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        : "text-zinc-300 cursor-not-allowed hidden"
                    }`}
                    title="Add schedule after"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className={`w-32 ${
                      isNewEntry ? "opacity-50 cursor-not-allowed hidden" : ""
                    }`}
                    disabled={isNewEntry}
                  />
                </div>
              </div>

              <div className="p-2 col-span-2 border rounded-md border-zinc-300">
                <div className="flex justify-end">
                  <div className="w-48">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Repeat Pattern
                    </label>
                    <select
                      value={repeatPattern}
                      onChange={(e) =>
                        setRepeatPattern(e.target.value as "all" | "evenodd")
                      }
                      className={`w-32 rounded-md border-zinc-300 ${
                        isNewEntry ? "opacity-50 cursor-not-allowed hidden" : ""
                      }`}
                      disabled={isNewEntry}
                    >
                      <option value="all">Every Week</option>
                      <option value="evenodd">Alternate Weeks</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 h-[348px]">
            {repeatPattern === "evenodd" && (
              <div>
                <ScheduleGrid
                  caption="Even Weeks"
                  schedule={schedule}
                  onTimeSlotToggle={handleTimeSlotToggle}
                  disabled={isNewEntry}
                />
              </div>
            )}

            <div>
              <ScheduleGrid
                caption={repeatPattern === "all" ? "Weekly Schedule" : "Odd Weeks"}
                schedule={repeatPattern === "evenodd" ? alternateSchedule : schedule}
                isAlternate={repeatPattern === "evenodd"}
                onTimeSlotToggle={handleTimeSlotToggle}
                disabled={isNewEntry}
              />
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
              <FileText className="w-4 h-4 mr-2" />
              View Report
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex items-center px-4 py-2 w-32 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || isNewEntry}
              className={`flex items-center px-4 py-2 w-32 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>

      {showReport && reportData && (
        <AvailabilityReport
          data={reportData}
          onClose={() => setShowReport(false)}
        />
      )}

      {showSplitModal && !isNewEntry && (
        <SplitScheduleModal
          startDate={startDate}
          endDate={endDate}
          onSplit={handleSplitSchedule}
          onClose={() => setShowSplitModal(false)}
        />
      )}
    </div>
  );
}