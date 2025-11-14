import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";
import { useAuth } from "../../../context/AuthContext";
import { Modal } from "../../common/Modal";
import toast from "react-hot-toast";
import * as ExcelJS from 'exceljs';
import { getAllUsersAvailability, UserAvailability } from "../../../lib/api/availability";

interface AvailabilityReportModalProps {
  onClose: () => void;
}

export function AvailabilityReportModal({ onClose }: AvailabilityReportModalProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const exportToExcel = async () => {
    if (!token) {
      toast.error(t("auth.loginRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const data: UserAvailability[] = await getAllUsersAvailability(token);

      if (!data || data.length === 0) {
        toast.error(t("reports.noDataAvailable"));
        setIsLoading(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Availability");

      const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const timeSlots = ["AM", "PM"];

      // Build headers
      const headers = [
        t("auth.firstName"),
        t("auth.lastName"),
        t("common.startDate"),
        t("common.endDate"),
        "Pattern",
        ...weekDays.flatMap(day => timeSlots.map(slot => `${t(`common.${day.toLowerCase()}`)} ${slot}`))
      ];

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

      // Process each user's availability schedules
      data.forEach((user) => {
        if (user.availability && user.availability.length > 0) {
          user.availability.forEach((schedule) => {
            const rowData = [
              user.firstName,
              user.lastName,
              schedule.startDate,
              schedule.endDate || "",
              schedule.repeatPattern === "evenodd" ? "Even/Odd" : "All Weeks",
            ];

            // Add schedule data for regular weeks
            weekDays.forEach((day) => {
              const dayKey = day as keyof typeof schedule.weeklySchedule;
              const daySchedule = schedule.weeklySchedule[dayKey];
              if (daySchedule) {
                rowData.push(daySchedule.am ? "✓" : "");
                rowData.push(daySchedule.pm ? "✓" : "");
              } else {
                rowData.push("");
                rowData.push("");
              }
            });

            worksheet.addRow(rowData);

            // If there's an odd week schedule, add it as a separate row
            if (schedule.oddWeeklySchedule && schedule.repeatPattern === "evenodd") {
              const oddRowData = [
                user.firstName,
                user.lastName,
                schedule.startDate,
                schedule.endDate || "",
                "Odd Weeks Only",
              ];

              weekDays.forEach((day) => {
                const dayKey = day as keyof typeof schedule.oddWeeklySchedule;
                const oddSchedule = schedule.oddWeeklySchedule;
                if (oddSchedule && oddSchedule[dayKey]) {
                  const daySchedule = oddSchedule[dayKey];
                  if (daySchedule) {
                    oddRowData.push(daySchedule.am ? "✓" : "");
                    oddRowData.push(daySchedule.pm ? "✓" : "");
                  } else {
                    oddRowData.push("");
                    oddRowData.push("");
                  }
                } else {
                  oddRowData.push("");
                  oddRowData.push("");
                }
              });

              worksheet.addRow(oddRowData);
            }
          });
        } else {
          // User with no availability schedules
          const rowData = [
            user.firstName,
            user.lastName,
            "",
            "",
            "No Schedule",
            ...Array(weekDays.length * 2).fill("")
          ];
          worksheet.addRow(rowData);
        }
      });

      // Set column widths
      worksheet.getColumn(1).width = 15; // First Name
      worksheet.getColumn(2).width = 15; // Last Name
      worksheet.getColumn(3).width = 12; // Start Date
      worksheet.getColumn(4).width = 12; // End Date
      worksheet.getColumn(5).width = 15; // Pattern

      // Set width for day columns
      for (let i = 6; i <= headers.length; i++) {
        worksheet.getColumn(i).width = 12;
      }

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          });
        }
      });

      const fileName = `Availability_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

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
      console.error("Failed to export availability:", error);
      toast.error(t("reports.exportFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title={t("reports.availabilityReport")}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t("reports.availabilityReportDescription")}
              </h3>
              <p className="text-xs text-blue-700">
                {t("reports.availabilityReportInstructions")}
              </p>
            </div>
          </div>
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
