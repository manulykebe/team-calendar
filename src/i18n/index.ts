import { createContext, useContext } from 'react';

export type Language = 'en' | 'fr' | 'nl';

export interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const TranslationContext = createContext<TranslationContextType>({
  language: 'nl',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const useTranslation = () => useContext(TranslationContext);

// Helper function to interpolate parameters in translations
export function interpolate(text: string, params: Record<string, string | number> = {}): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

// Get nested translation value using dot notation
export function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}