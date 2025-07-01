import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Period, PeriodFormData } from "../../types/period";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { useTranslation } from "../../context/TranslationContext";

interface PeriodFormProps {
  period?: Period | null;
  defaultName?: string;
  onSubmit: (data: PeriodFormData) => void;
  onCancel: () => void;
  existingPeriods: Period[];
}

export function PeriodForm({
  period,
  defaultName,
  onSubmit,
  onCancel,
  existingPeriods,
}: PeriodFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PeriodFormData>({
    name: period?.name || defaultName || "",
    startDate: period?.startDate || "",
    endDate: period?.endDate || "",
    editingStatus: period?.editingStatus || "closed", // Default to 'closed'
  });
  const [errors, setErrors] = useState<Partial<PeriodFormData>>({});

  useEffect(() => {
    if (period) {
      setFormData({
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        editingStatus: period.editingStatus,
      });
    } else {
      // For new periods, ensure default values are set
      setFormData(prev => ({
        ...prev,
        name: defaultName || "",
        editingStatus: "closed", // Explicitly set to 'closed' for new periods
      }));
    }
  }, [period, defaultName]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PeriodFormData> = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = t('periods.validationErrors.nameRequired');
    }
    if (!formData.startDate) {
      newErrors.startDate = t('periods.validationErrors.startDateRequired');
    }
    if (!formData.endDate) {
      newErrors.endDate = t('periods.validationErrors.endDateRequired');
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      if (!isAfter(parseISO(formData.endDate), parseISO(formData.startDate))) {
        newErrors.endDate = t('periods.validationErrors.endDateAfterStart');
      }

      // Check for overlaps with existing periods
      const hasOverlap = existingPeriods.some(existingPeriod => {
        const existingStart = parseISO(existingPeriod.startDate);
        const existingEnd = parseISO(existingPeriod.endDate);
        const newStart = parseISO(formData.startDate);
        const newEnd = parseISO(formData.endDate);

        // Check if new period overlaps with existing period
        return (
          (newStart <= existingEnd && newEnd >= existingStart) ||
          (newStart === existingStart || newEnd === existingEnd)
        );
      });

      if (hasOverlap) {
        newErrors.startDate = t('periods.validationErrors.overlappingDates');
        newErrors.endDate = t('periods.validationErrors.overlappingDates');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof PeriodFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-zinc-900 mb-4">
        {period ? t('periods.editPeriod') : t('periods.addPeriod')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            {t('periods.nameLabel')} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? "border-red-300" : "border-zinc-300"
            }`}
            placeholder={t('periods.enterPeriodName')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            {t('periods.editingStatus')} *
          </label>
          <select
            value={formData.editingStatus}
            onChange={(e) => handleChange("editingStatus", e.target.value as any)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="closed">{t('periods.closed')}</option>
            <option value="open-holiday">{t('periods.openHoliday')}</option>
            <option value="open-desiderata">{t('periods.openDesiderata')}</option>
          </select>
          {!period && (
            <p className="mt-1 text-xs text-zinc-500">{t('periods.defaultClosed')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            {t('events.startDate')} *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.startDate ? "border-red-300" : "border-zinc-300"
            }`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            {t('events.endDate')} *
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            min={formData.startDate}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.endDate ? "border-red-300" : "border-zinc-300"
            }`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
        >
          <X className="w-4 h-4 mr-2" />
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Check className="w-4 h-4 mr-2" />
          {period ? t('periods.updatePeriod') : t('periods.addPeriod')}
        </button>
      </div>
    </form>
  );
}