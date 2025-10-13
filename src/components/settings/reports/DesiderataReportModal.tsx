import { useState, useEffect } from "react";
import { X, Download, FileText } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";
import { useAuth } from "../../../context/AuthContext";
import { Modal } from "../../common/Modal";
import toast from "react-hot-toast";
import * as ExcelJS from 'exceljs';
import { getPendingDesiderata, PendingDesiderataGridItem } from "../../../lib/api/desiderata";

interface DesiderataReportModalProps {
  onClose: () => void;
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  editingStatus?: string;
}

export function DesiderataReportModal({ onClose }: DesiderataReportModalProps) {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user names once token is available
  useEffect(() => {
    if (token) {
      loadUserNames();
    }
  }, [token]);

  // Load initial period on mount
  useEffect(() => {
    if (token && user && !isInitialized) {
      loadInitialPeriod();
    }
  }, [token, user, isInitialized]);

  // Load periods when year changes (but not on initial mount)
  useEffect(() => {
    if (isInitialized && token && user) {
      loadPeriods(year);
    }
  }, [year, isInitialized]);

  const loadInitialPeriod = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      console.log('Loading initial period, current year:', currentYear);

      // Try current year first
      let foundYear = currentYear.toString();
      let response = await fetch(`/api/sites/${user?.site}/periods/${currentYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Current year response status:', response.status);

      let data = null;
      if (response.ok) {
        data = await response.json();
        console.log('Current year periods:', data.periods);
        const openDesiderataPeriod = data.periods?.find(
          (p: Period) => p.editingStatus === "open-desiderata"
        );

        if (openDesiderataPeriod) {
          console.log('Found open-desiderata period in current year:', openDesiderataPeriod);
          setYear(foundYear);
          setPeriods(data.periods || []);
          setSelectedPeriod(openDesiderataPeriod.id);
          setIsInitialized(true);
          return;
        }
      }

      // If not found in current year, try next year
      console.log('Not found in current year, trying next year:', nextYear);
      foundYear = nextYear.toString();
      response = await fetch(`/api/sites/${user?.site}/periods/${nextYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Next year response status:', response.status);

      if (response.ok) {
        data = await response.json();
        console.log('Next year periods:', data.periods);
        const openDesiderataPeriod = data.periods?.find(
          (p: Period) => p.editingStatus === "open-desiderata"
        );

        if (openDesiderataPeriod) {
          console.log('Found open-desiderata period in next year:', openDesiderataPeriod);
          setYear(foundYear);
          setPeriods(data.periods || []);
          setSelectedPeriod(openDesiderataPeriod.id);
          setIsInitialized(true);
          return;
        }
      }

      // If no open-desiderata period found, default to current year's first period
      console.log('No open-desiderata period found, loading current year periods');
      await loadPeriods(currentYear.toString());
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to load initial period:", error);
      setIsInitialized(true);
    }
  };

  const loadPeriods = async (targetYear: string) => {
    try {
      console.log('Loading periods for year:', targetYear);
      const response = await fetch(`/api/sites/${user?.site}/periods/${targetYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Load periods response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded periods:', data.periods);
        setPeriods(data.periods || []);

        // Try to find open-desiderata period first
        const openDesiderataPeriod = data.periods?.find(
          (p: Period) => p.editingStatus === "open-desiderata"
        );

        if (openDesiderataPeriod) {
          console.log('Setting selected period to open-desiderata:', openDesiderataPeriod.id);
          setSelectedPeriod(openDesiderataPeriod.id);
        } else if (data.periods && data.periods.length > 0) {
          console.log('No open-desiderata, setting first period:', data.periods[0].id);
          setSelectedPeriod(data.periods[0].id);
        } else {
          console.log('No periods found');
          setSelectedPeriod("");
        }
      } else {
        console.error('Failed to load periods, status:', response.status);
        setPeriods([]);
        setSelectedPeriod("");
      }
    } catch (error) {
      console.error("Failed to load periods:", error);
      setPeriods([]);
      setSelectedPeriod("");
    }
  };

  const loadUserNames = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        const names: Record<string, string> = {};
        users.forEach((u: any) => {
          names[u.id] = `${u.firstName} ${u.lastName}`;
        });
        setUserNames(names);
      }
    } catch (error) {
      console.error("Failed to load user names:", error);
    }
  };

  useEffect(() => {
    loadUserNames();
  }, []);

  const exportToExcel = async () => {
    if (!selectedPeriod || !token) {
      toast.error(t("reports.selectPeriod"));
      return;
    }

    setIsLoading(true);
    try {
      const data = await getPendingDesiderata(token, year, selectedPeriod);

      if (!data.grid || data.grid.length === 0) {
        toast.error(t("reports.noDataAvailable"));
        setIsLoading(false);
        return;
      }

      const grid = data.grid;
      const userIds = Object.keys(grid[0]).filter(
        (key) => key !== "date" && key !== "total"
      );
      
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const periodName = periods.find((p) => p.id === selectedPeriod)?.name || selectedPeriod;
      const sheetName = `${periodName.substring(0, 25)}`;
      const worksheet = workbook.addWorksheet(sheetName);
      
      // Set up the headers
      const headers = [
        t("reports.date"),
        ...userIds.map(userId => userNames[userId] || userId),
        t("reports.total")
      ];
      
      // Add headers to worksheet
      worksheet.addRow(headers);
      
      // Format header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6E6' }
        };
        cell.border = {
          bottom: { style: 'thin' }
        };
      });
      
      // Add data rows
      grid.forEach((row: PendingDesiderataGridItem) => {
        const rowData = [
          row.date,
          ...userIds.map(userId => {
            const value = row[userId];
            return typeof value === "string" && value !== "" ? "X" : "";
          }),
          row.total
        ];
        worksheet.addRow(rowData);
      });
      
      // Set column widths
      worksheet.getColumn(1).width = 12; // Date column
      userIds.forEach((_, index) => {
        worksheet.getColumn(index + 2).width = 20; // User columns
      });
      worksheet.getColumn(userIds.length + 2).width = 10; // Total column
      
      // Generate the Excel file
      const fileName = `Desiderata_${year}_${periodName.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
      
      // Create a buffer and save it as a file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(t("reports.exportSuccess"));
    } catch (error) {
      console.error("Failed to export desiderata:", error);
      toast.error(t("reports.exportFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear + i - 2).toString());

  return (
    <Modal onClose={onClose} title={t("reports.desiderataReport")}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t("reports.desiderataReportDescription")}
              </h3>
              <p className="text-xs text-blue-700">
                {t("reports.desiderataReportInstructions")}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            {t("common.year")}
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            {t("reports.period")}
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={periods.length === 0}
          >
            {periods.length === 0 ? (
              <option value="">{t("reports.noPeriodsAvailable")}</option>
            ) : (
              periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={exportToExcel}
            disabled={isLoading || !selectedPeriod}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? t("reports.exporting") : t("reports.exportToExcel")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
