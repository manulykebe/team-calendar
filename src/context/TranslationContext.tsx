import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationContextType, interpolate, getNestedValue } from '../i18n';
import { translations } from '../i18n/translations';

const TranslationContext = createContext<TranslationContextType>({
  language: 'nl',
  setLanguage: () => {},
  t: (key: string) => key,
});

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to Dutch
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'nl';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key);
    
    if (typeof translation !== 'string') {
      // Fallback to English if translation not found
      const fallback = getNestedValue(translations.en, key);
      if (typeof fallback === 'string') {
        return params ? interpolate(fallback, params) : fallback;
      }
      // Return the key if no translation found
      return key;
    }
    
    return params ? interpolate(translation, params) : translation;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};