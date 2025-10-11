import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Info, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';
import { DesiderataAvailability, PriorityLimits, DesiderataSelection } from '../../utils/desiderataUtils';

interface DesiderataAvailabilityPanelProps {
  availability: DesiderataAvailability;
  limits: PriorityLimits;
  currentSelection: DesiderataSelection;
  existingSelections: DesiderataSelection[];
  periodName: string;
  isVisible: boolean;
  onClose?: () => void;
}

export function DesiderataAvailabilityPanel({
  availability,
  limits,
  currentSelection,
  existingSelections,
  periodName,
  isVisible,
  onClose,
}: DesiderataAvailabilityPanelProps) {
  const { t } = useTranslation();
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate total usage
  const totalUsed = existingSelections.reduce(
    (acc, sel) => ({
      workingDaysUsed: acc.workingDaysUsed + sel.workingDaysUsed,
      weekendDaysUsed: acc.weekendDaysUsed + sel.weekendDaysUsed,
      totalDaysUsed: acc.totalDaysUsed + sel.totalDaysUsed,
    }),
    { ...currentSelection }
  );

  const remainingWorkingDays = limits.maxWorkingDays - totalUsed.workingDaysUsed;
  const remainingWeekendDays = limits.maxWeekendDays - totalUsed.weekendDaysUsed;

  const workingDaysPercentage = (totalUsed.workingDaysUsed / limits.maxWorkingDays) * 100;
  const weekendDaysPercentage = (totalUsed.weekendDaysUsed / limits.maxWeekendDays) * 100;

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-50';
    if (percentage >= 80) return 'text-orange-600 bg-orange-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border-2 border-blue-200 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag Handle */}
      <div className="drag-handle bg-blue-600 px-4 py-3 cursor-grab active:cursor-grabbing flex items-center justify-between">
        <div className="flex items-center space-x-2 text-white">
          <span className="font-semibold">{t('desiderata.desiderataDays') || 'Desiderata'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="text-white hover:text-blue-100 transition-colors p-1"
            title={isCollapsed ? t('common.expand') || 'Expand' : t('common.collapse') || 'Collapse'}
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white hover:text-blue-100 transition-colors p-1"
              title={t('common.close') || 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
        {/* Period Info */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center space-x-2 text-blue-800">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">{periodName}</span>
          </div>
        </div>

        {/* Working Days */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {t('desiderata.workingDays') || 'Working Days'}
              </span>
            </div>
            <span className={`text-sm font-bold px-2 py-1 rounded ${getUsageColor(workingDaysPercentage)}`}>
              {totalUsed.workingDaysUsed} / {limits.maxWorkingDays}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(workingDaysPercentage)}`}
              style={{ width: `${Math.min(workingDaysPercentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{t('desiderata.remaining') || 'Remaining'}: {remainingWorkingDays}</span>
            <span>{Math.round(workingDaysPercentage)}%</span>
          </div>
        </div>

        {/* Weekend Days */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {t('desiderata.weekendDays') || 'Weekend Days'}
              </span>
            </div>
            <span className={`text-sm font-bold px-2 py-1 rounded ${getUsageColor(weekendDaysPercentage)}`}>
              {totalUsed.weekendDaysUsed} / {limits.maxWeekendDays}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(weekendDaysPercentage)}`}
              style={{ width: `${Math.min(weekendDaysPercentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{t('desiderata.remaining') || 'Remaining'}: {remainingWeekendDays}</span>
            <span>{Math.round(weekendDaysPercentage)}%</span>
          </div>
        </div>

        {/* Warnings */}
        {(workingDaysPercentage >= 80 || weekendDaysPercentage >= 80) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              {workingDaysPercentage >= 100 || weekendDaysPercentage >= 100
                ? (t('desiderata.limitExceeded') || 'Selection limit exceeded')
                : (t('desiderata.approachingLimit') || 'Approaching selection limit')}
            </p>
          </div>
        )}

        {/* Availability Details */}
        <div className="border-t pt-3 space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>{t('desiderata.totalAvailable') || 'Total Available'}:</span>
            <span className="font-medium">{availability.totalAvailableDays} {t('common.days') || 'days'}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('desiderata.publicHolidays') || 'Public Holidays'}:</span>
            <span className="font-medium">{availability.publicHolidays.length}</span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
