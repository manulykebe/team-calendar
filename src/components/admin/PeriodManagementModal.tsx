import { useState, useEffect } from "react";
import { X, Plus, Edit2, Trash2, RotateCcw, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { getPeriods, savePeriods, resetToDefaultPeriods } from "../../lib/api/periods";
import { Period, PeriodFormData } from "../../types/period";
import { PeriodForm } from "./PeriodForm";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import toast from "react-hot-toast";
import { useTranslation } from "../../context/TranslationContext";

interface PeriodManagementModalProps {
  onClose: () => void;
}

export function PeriodManagementModal({ onClose }: PeriodManagementModalProps) {
  const { token } = useAuth();
  const { currentUser } = useApp();
  const { t } = useTranslation();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, [selectedYear]);

  const loadPeriods = async () => {
    if (!token || !currentUser) return;

    try {
      setLoading(true);
      setError("");
      const data = await getPeriods(token, currentUser.site, selectedYear);
      setPeriods(data.periods || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load periods";
      setError(errorMessage);
      toast.error(errorMessage);
      setPeriods([]); // Ensure periods is always an array
    } finally {
      setLoading(false);
    }
  };

  const validatePeriods = (newPeriods: Period[]): string | null => {
    // Sort periods by start date for validation
    const sortedPeriods = [...newPeriods].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    for (let i = 0; i < sortedPeriods.length; i++) {
      const current = sortedPeriods[i];
      
      // Check if end date is after start date
      if (!isAfter(parseISO(current.endDate), parseISO(current.startDate))) {
        return `Period "${current.name}": End date must be after start date`;
      }

      // Check for overlaps with next period
      if (i < sortedPeriods.length - 1) {
        const next = sortedPeriods[i + 1];
        if (isAfter(parseISO(current.endDate), parseISO(next.startDate)) || 
            current.endDate === next.startDate) {
          return `Periods "${current.name}" and "${next.name}" have overlapping dates`;
        }
      }
    }

    return null;
  };

  const handleSavePeriods = async () => {
    if (!token || !currentUser || !periods) return;

    const validationError = validatePeriods(periods);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);
      await savePeriods(token, currentUser.site, selectedYear, periods);
      toast.success(t('periods.periodsSaved'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('periods.failedToSavePeriods');
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!token || !currentUser) return;

    if (!confirm(t('periods.resetConfirmation'))) {
      return;
    }

    try {
      setSaving(true);
      const data = await resetToDefaultPeriods(token, currentUser.site, selectedYear);
      setPeriods(data.periods || []);
      toast.success(t('periods.periodsReset'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('periods.failedToResetPeriods');
      toast.error(errorMessage);
      setPeriods([]); // Ensure periods is always an array
    } finally {
      setSaving(false);
    }
  };

  const handleAddPeriod = () => {
    setEditingPeriod(null);
    setShowForm(true);
  };

  const handleEditPeriod = (period: Period) => {
    setEditingPeriod(period);
    setShowForm(true);
  };

  const handleDeletePeriod = (periodId: string) => {
    if (!confirm(t('common.confirm'))) {
      return;
    }

    setPeriods(prev => (prev || []).filter(p => p.id !== periodId));
    toast.success(t('common.delete'));
  };

  const handleFormSubmit = (formData: PeriodFormData) => {
    if (editingPeriod) {
      // Update existing period
      setPeriods(prev => (prev || []).map(p => 
        p.id === editingPeriod.id 
          ? { ...p, ...formData, updatedAt: new Date().toISOString() }
          : p
      ));
      toast.success(t('common.success'));
    } else {
      // Add new period
      const newPeriod: Period = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPeriods(prev => [...(prev || []), newPeriod]);
      toast.success(t('common.success'));
    }
    setShowForm(false);
    setEditingPeriod(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPeriod(null);
  };

  const getNextPeriodNumber = () => {
    return (periods || []).length + 1;
  };

  const getEditingStatusLabel = (status: string) => {
    switch (status) {
      case 'closed': return t('periods.closed');
      case 'open-holiday': return t('periods.openHoliday');
      case 'open-desiderata': return t('periods.openDesiderata');
      default: return status;
    }
  };

  const getEditingStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-red-100 text-red-800';
      case 'open-holiday': return 'bg-yellow-100 text-yellow-800';
      case 'open-desiderata': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  // Ensure periods is always an array for safe operations
  const safePeriods = periods || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-zinc-900">{t('periods.periodManagement')}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-4 text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {t('common.site')}
                </label>
                <div className="px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-md text-sm font-medium">
                  {currentUser.site.toUpperCase()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {t('common.year')}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 1 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <button
              onClick={handleAddPeriod}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={saving || showForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('periods.addPeriod')}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {showForm && (
                <div className="mb-6 p-4 bg-zinc-50 rounded-lg border">
                  <PeriodForm
                    period={editingPeriod}
                    defaultName={editingPeriod ? undefined : `Period ${getNextPeriodNumber()}`}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    existingPeriods={safePeriods.filter(p => p.id !== editingPeriod?.id)}
                  />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {t('periods.nameLabel')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {t('events.startDate')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {t('events.endDate')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {t('periods.editingStatus')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {t('users.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    {safePeriods.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                          {t('periods.noPeriodsForYear', { year: selectedYear })}
                        </td>
                      </tr>
                    ) : (
                      safePeriods
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map((period) => (
                          <tr key={period.id} className="hover:bg-zinc-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                              {period.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                              {format(parseISO(period.startDate), "MMM d, yyyy")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                              {format(parseISO(period.endDate), "MMM d, yyyy")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEditingStatusColor(period.editingStatus)}`}>
                                {getEditingStatusLabel(period.editingStatus)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditPeriod(period)}
                                  className="text-blue-600 hover:text-blue-900"
                                  disabled={saving || showForm}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePeriod(period.id)}
                                  className="text-red-600 hover:text-red-900"
                                  disabled={saving || showForm}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-zinc-50">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-50"
            disabled={saving || showForm}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('periods.resetToDefaults')}
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-50"
              disabled={saving}
            >
              {t('common.close')}
            </button>
            <button
              onClick={handleSavePeriods}
              disabled={saving || showForm}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('periods.saveChanges')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}