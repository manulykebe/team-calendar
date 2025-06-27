import { Shield } from "lucide-react";
import { useTranslation } from "../../context/TranslationContext";

interface OnDutyBadgeProps {
  className?: string;
}

export function OnDutyBadge({ className = "" }: OnDutyBadgeProps) {
  const { t } = useTranslation();
  
  return (
    <div 
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ${className}`}
      title={t('calendar.onDuty')}
    >
      <Shield className="w-3 h-3 mr-0.5" />
      <span>{t('calendar.onDuty')}</span>
    </div>
  );
}