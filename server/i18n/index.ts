import { translations } from './translations.js';

export type Language = 'en' | 'fr' | 'nl';

export class I18n {
  private language: Language;

  constructor(language: Language = 'en') {
    this.language = language;
  }

  setLanguage(language: Language): void {
    this.language = language;
  }

  getLanguage(): Language {
    return this.language;
  }

  t(key: string, params?: Record<string, any>): string {
    // Get the translation from the current language
    const translation = this.getNestedValue(translations[this.language], key);
    
    // If translation not found, try English as fallback
    if (typeof translation !== 'string') {
      const fallback = this.getNestedValue(translations.en, key);
      if (typeof fallback === 'string') {
        return params ? this.interpolate(fallback, params) : fallback;
      }
      // Return the key if no translation found
      return key;
    }
    
    return params ? this.interpolate(translation, params) : translation;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private interpolate(text: string, params: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }
}

// Create a global instance for use in middleware
export const globalI18n = new I18n();