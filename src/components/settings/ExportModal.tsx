import { useState, useCallback } from "react";
import { X, Download, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../lib/api/config";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useTranslation } from "../../context/TranslationContext";

interface ExportModalProps {
  userId: string;
  site: string;
  onClose: () => void;
}

export function ExportModal({ userId, site, onClose }: ExportModalProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportType, setExportType] = useState<"all" | "user">("all");
  const [isExporting, setIsExporting] = useState(false);
  const [holidays] = useState([]);

  const isPublicHoliday = useCallback((date: Date | string): boolean => {
    return false;
  }, [holidays]);

  const handleExport = async () => {
    if (!token) return;

    setIsExporting(true);

    let url = `${API_URL}/export/${site}`;
    if (exportType === "user") {
      url += `/${userId}`;
    }

    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    // Close the modal immediately
    onClose();

    // Show download progress toast
    const toastId = toast.loading(t('export.preparingExport'), {
      duration: Infinity, // Keep it until we manually dismiss it
    });

    try {
      // Fetch the file
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('export.failedToExport'));
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      // Generate filename
      const timestamp = format(new Date(), "yyyy-MM-dd");
      const filename = exportType === "all" 
        ? `events-${site}-${timestamp}.csv`
        : `events-${site}-${userId}-${timestamp}.csv`;
      
      link.setAttribute("download", filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl);

      // Show success message
      toast.success(t('export.exportDownloaded'), { 
        id: toastId,
        duration: 3000 
      });

    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(t('export.failedToExport'), { 
        id: toastId,
        duration: 4000 
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-zinc-900">
              {t('export.exportEvents')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
            disabled={isExporting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              {t('export.exportType')}
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as "all" | "user")}
              className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isExporting}
            >
              <option value="all">{t('export.allEvents')}</option>
              <option value="user">{t('export.myEventsOnly')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {t('export.startDateOptional')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isExporting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {t('export.endDateOptional')}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isExporting}
              />
            </div>
          </div>

          <div className="text-sm text-zinc-500">
            {t('export.leaveDatesEmpty')}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-zinc-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-50"
            disabled={isExporting}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? t('export.exporting') : t('common.export')}
          </button>
        </div>
      </div>
    </div>
  );
}