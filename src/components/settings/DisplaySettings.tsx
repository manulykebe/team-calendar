import { User } from "../../types/user";
import { useTranslation } from "../../context/TranslationContext";

interface DisplaySettingsProps {
  currentUser: User | null;
  onWorkStartChange: (value: string) => void;
  onWeekNumberChange: (value: "left" | "right" | "none") => void;
}

export function DisplaySettings({
  currentUser,
  onWorkStartChange,
  onWeekNumberChange,
}: DisplaySettingsProps) {
  const { t } = useTranslation();

  return (
    <div data-tsx-id="display-settings">
      <h3 className="text-sm font-medium text-zinc-900 mb-2">{t('settings.display')}</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-zinc-700">{t('settings.weekStartsOn')}</label>
          <select
            value={currentUser?.app?.weekStartsOn || "Monday"}
            onChange={(e) => onWorkStartChange(e.target.value)}
            className="mt-1 block w-40 rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="Monday">{t('settings.monday')}</option>
            <option value="Sunday">{t('settings.sunday')}</option>
            <option value="Saturday">{t('settings.saturday')}</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm text-zinc-700">{t('settings.showWeekNumber')}</label>
          <select
            value={currentUser?.settings?.showWeekNumber || "right"}
            onChange={(e) =>
              onWeekNumberChange(e.target.value as "left" | "right" | "none")
            }
            className="mt-1 block w-40 rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="left">{t('settings.left')}</option>
            <option value="right">{t('settings.right')}</option>
            <option value="none">{t('settings.none')}</option>
          </select>
        </div>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="rounded border-zinc-300 text-blue-600"
          />
          <span className="text-sm text-zinc-700">{t('settings.showWeekends')}</span>
        </label>
      </div>
    </div>
  );
}