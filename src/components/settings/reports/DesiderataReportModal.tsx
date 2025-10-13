import { useState, useEffect } from "react";
import { X, Download, FileText } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";
import { useAuth } from "../../../context/AuthContext";
import { Modal } from "../../common/Modal";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { getPendingDesiderata, PendingDesiderataGridItem } from "../../../lib/api/desiderata";

interface DesiderataReportModalProps {
  onClose: () => void;
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export function DesiderataReportModal({ onClose }: DesiderataReportModalProps) {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPeriods();
  }, [year]);

  const loadPeriods = async () => {
    try {
      const response = await fetch(`/api/sites/${user?.site}/periods/${year}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPeriods(data.periods || []);
        if (data.periods && data.periods.length > 0) {
          setSelectedPeriod(data.periods[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load periods:", error);
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

      const excelData = grid.map((row: PendingDesiderataGridItem) => {
        const excelRow: any = {
          [t("reports.date")]: row.date,
        };

        userIds.forEach((userId) => {
          const userName = userNames[userId] || userId;
          const value = row[userId];
          excelRow[userName] = typeof value === "string" && value !== "" ? "X" : "";
        });

        excelRow[t("reports.total")] = row.total;

        return excelRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const columnWidths = [
        { wch: 12 },
        ...userIds.map(() => ({ wch: 20 })),
        { wch: 10 },
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      const periodName = periods.find((p) => p.id === selectedPeriod)?.name || selectedPeriod;
      const sheetName = `${periodName.substring(0, 25)}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const fileName = `Desiderata_${year}_${periodName.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

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
