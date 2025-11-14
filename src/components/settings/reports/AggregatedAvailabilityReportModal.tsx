import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";
import { useAuth } from "../../../context/AuthContext";
import { useApp } from "../../../context/AppContext";
import { Modal } from "../../common/Modal";
import toast from "react-hot-toast";
import * as ExcelJS from 'exceljs';
import { getAllAvailabilityReportAggregated } from "../../../lib/api/report";

interface AggregatedAvailabilityReportModalProps {
  onClose: () => void;
}

interface AggregatedReportRow {
  date: string;
  datepart: string;
  users: string;
}

export function AggregatedAvailabilityReportModal({ onClose }: AggregatedAvailabilityReportModalProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const exportToExcel = async () => {
    if (!token || !currentUser) {
      toast.error(t("auth.authenticationRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const data = await getAllAvailabilityReportAggregated(token, currentUser.site, year);

      if (!data || data.length === 0) {
        toast.error(t("reports.noDataAvailable"));
        setIsLoading(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Aggregated Availability");

      const headers = [t("common.date"), "Period", t("reports.unavailableUsers")];
      worksheet.addRow(headers);

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6E6' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      data.sort((a: AggregatedReportRow, b: AggregatedReportRow) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.datepart.localeCompare(b.datepart);
      });

      data.forEach((row: AggregatedReportRow) => {
        worksheet.addRow([
          row.date,
          row.datepart,
          row.users
        ]);
      });

      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 10;
      worksheet.getColumn(3).width = 30;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          });
        }
      });

      const fileName = `Aggregated_Availability_Report_${year}_${new Date().toISOString().split('T')[0]}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(t("reports.exportSuccess"));
    } catch (error) {
      console.error("Failed to export aggregated availability:", error);
      toast.error(t("reports.exportFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear + i - 2).toString());

  return (
    <Modal onClose={onClose} title={t("reports.aggregatedAvailability")}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t("reports.aggregatedAvailabilityDescription")}
              </h3>
              <p className="text-xs text-blue-700">
                {t("reports.aggregatedAvailabilityInstructions")}
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

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={exportToExcel}
            disabled={isLoading}
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
