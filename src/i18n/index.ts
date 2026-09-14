import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'ta', label: 'தமிழ்', short: 'த' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
};

/**
 * Reads the device language from Intl, which Hermes ships on both platforms —
 * saves pulling in a native module just for this. Falls back to English when
 * the device locale isn't one we translate.
 */
export function detectDeviceLanguage(): LanguageCode {
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
    const code = locale.split(/[-_]/)[0].toLowerCase();
    const match = LANGUAGES.find(language => language.code === code);
    return match ? match.code : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  // every language shares one namespace, so no suspense boundary is needed
  react: { useSuspense: false },
  interpolation: { escapeValue: false },
});

export default i18n;
