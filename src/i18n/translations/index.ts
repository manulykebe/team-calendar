import { en } from './en';
import { fr } from './fr';
import { nl } from './nl';

export const translations = {
  en,
  fr,
  nl,
};

export type TranslationKey = keyof typeof en;