import { useCallback, useState, useEffect } from 'react';
import { Period } from '../types/period';
import { Holiday } from '../lib/api/holidays';
import {
  calculatePeriodAvailability,
  calculatePriorityLimits,
  validateSelection,
  autoExtendForMandatoryWeekend,
  countSelectionDays,
  checkMandatoryWeekendStart,
  checkMandatoryWeekendEnd,
  DesiderataAvailability,
  PriorityLimits,
  DesiderataSelection,
  SelectionValidation,
} from '../utils/desiderataUtils';
import { getDayCellSelectability } from '../utils/periodUtils';

export interface UseDesiderataSelectionProps {
  periods: Period[];
  holidays: Holiday[];
  userPriority: number;
}

export interface UseDesiderataSelectionReturn {
  /**
   * Current period availability
   */
  availability: DesiderataAvailability | null;

  /**
   * Priority-based limits
   */
  limits: PriorityLimits | null;

  /**
   * Current selection being made
   */
  currentSelection: DesiderataSelection;

  /**
   * Existing selections (from saved events)
   */
  existingSelections: DesiderataSelection[];

  /**
   * Validate a selection
   */
  validateNewSelection: (
    startDate: Date,
    endDate: Date
  ) => SelectionValidation | null;

  /**
   * Auto-extend selection for mandatory weekends
   */
  applyMandatoryExtension: (
    startDate: Date,
    endDate: Date
  ) => { startDate: Date; endDate: Date; extended: boolean; reason?: string } | null;

  /**
   * Update current selection
   */
  updateCurrentSelection: (startDate: Date | null, endDate: Date | null) => void;

  /**
   * Get period for date
   */
  getPeriodForDate: (date: Date) => Period | null;

  /**
   * Check if panel should be visible
   */
  shouldShowPanel: boolean;

  /**
   * Hide panel
   */
  hidePanel: () => void;

  /**
   * Show panel
   */
  showPanel: () => void;

  /**
   * Current active period
   */
  activePeriod: Period | null;
}

/**
 * Comprehensive hook for desiderata selection management
 */
export function useDesiderataSelection({
  periods,
  holidays,
  userPriority = 2,
}: UseDesiderataSelectionProps): UseDesiderataSelectionReturn {
  const [currentSelection, setCurrentSelection] = useState<DesiderataSelection>({
    workingDaysUsed: 0,
    weekendDaysUsed: 0,
    totalDaysUsed: 0,
  });

  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [availability, setAvailability] = useState<DesiderataAvailability | null>(null);
  const [limits, setLimits] = useState<PriorityLimits | null>(null);
  const [panelVisible, setPanelVisible] = useState(true);

  /**
   * Get period for a date
   */
  const getPeriodForDate = useCallback(
    (date: Date): Period | null => {
      const selectability = getDayCellSelectability(date, periods);
      return selectability.period;
    },
    [periods]
  );

  /**
   * Update current selection and recalculate availability
   */
  const updateCurrentSelection = useCallback(
    (startDate: Date | null, endDate: Date | null) => {
      if (!startDate || !endDate) {
        setCurrentSelection({
          workingDaysUsed: 0,
          weekendDaysUsed: 0,
          totalDaysUsed: 0,
        });
        setActivePeriod(null);
        setAvailability(null);
        setLimits(null);
        return;
      }

      // Get period for selection
      const period = getPeriodForDate(startDate);
      if (!period || period.editingStatus !== 'open-desiderata') {
        setActivePeriod(null);
        setAvailability(null);
        setLimits(null);
        return;
      }

      // Calculate availability for period
      const periodAvailability = calculatePeriodAvailability(period, holidays);
      const periodLimits = calculatePriorityLimits(periodAvailability, userPriority);

      // Count current selection
      const selection = countSelectionDays(startDate, endDate, holidays);

      setActivePeriod(period);
      setAvailability(periodAvailability);
      setLimits(periodLimits);
      setCurrentSelection(selection);
    },
    [getPeriodForDate, holidays, userPriority]
  );

  /**
   * Validate a new selection
   */
  const validateNewSelection = useCallback(
    (startDate: Date, endDate: Date): SelectionValidation | null => {
      const period = getPeriodForDate(startDate);
      if (!period || period.editingStatus !== 'open-desiderata') {
        return null;
      }

      // TODO: Load existing selections from saved events
      const existingSelections: DesiderataSelection[] = [];

      return validateSelection(
        startDate,
        endDate,
        period,
        holidays,
        userPriority,
        existingSelections
      );
    },
    [getPeriodForDate, holidays, userPriority]
  );

  /**
   * Apply mandatory weekend extension
   */
  const applyMandatoryExtension = useCallback(
    (startDate: Date, endDate: Date) => {
      const period = getPeriodForDate(startDate);
      if (!period || period.editingStatus !== 'open-desiderata') {
        return null;
      }

      return autoExtendForMandatoryWeekend(startDate, endDate, period, holidays);
    },
    [getPeriodForDate, holidays]
  );

  const shouldShowPanel = panelVisible && activePeriod !== null && activePeriod.editingStatus === 'open-desiderata';

  const hidePanel = useCallback(() => {
    setPanelVisible(false);
  }, []);

  const showPanel = useCallback(() => {
    setPanelVisible(true);
  }, []);

  return {
    availability,
    limits,
    currentSelection,
    existingSelections: [], // TODO: Load from saved events
    validateNewSelection,
    applyMandatoryExtension,
    updateCurrentSelection,
    getPeriodForDate,
    shouldShowPanel,
    hidePanel,
    showPanel,
    activePeriod,
  };
}
