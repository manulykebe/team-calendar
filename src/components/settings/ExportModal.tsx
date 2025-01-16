import { useState } from "react";
import { X, Download, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../lib/api/config";
import { format } from "date-fns";

interface ExportModalProps {
  userId: string;
  site: string;
  onClose: () => void;
}

export function ExportModal({ userId, site, onClose }: ExportModalProps) {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportType, setExportType] = useState<"all" | "user">("all");

  const handleExport = () => {
    if (!token) return;

    let url = `${API_URL}/export/${site}`;
    if (exportType === "user") {
      url += `/${userId}`;
    }

    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    // Create a hidden anchor element to trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "");
    
    // Add authorization header through a fetch request
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error("Error downloading file:", error);
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-zinc-900">
              Export Events
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Export Type
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as "all" | "user")}
              className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Events</option>
              <option value="user">My Events Only</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="text-sm text-zinc-500">
            Leave dates empty to export all events. If you specify a date range, only events within that range will be exported.
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-zinc-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}