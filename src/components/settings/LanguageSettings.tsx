import { Globe } from "lucide-react";
import { useTranslation } from "../../context/TranslationContext";
import { Language } from "../../i18n";

export function LanguageSettings() {
  const { language, setLanguage, t } = useTranslation();

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-zinc-900 mb-2 flex items-center">
        <Globe className="w-4 h-4 mr-2" />
        {t('common.language')}
      </h3>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700">
          {t('common.language')}:
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}