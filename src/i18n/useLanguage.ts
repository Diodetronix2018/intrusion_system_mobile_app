import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageCode, LANGUAGES } from './index';

/** Current language plus a setter, for the language switcher. */
export function useLanguage() {
  const { i18n } = useTranslation();

  const current = (LANGUAGES.find(
    language => language.code === i18n.resolvedLanguage,
  ) ?? LANGUAGES[0]) as (typeof LANGUAGES)[number];

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      i18n.changeLanguage(code);
    },
    [i18n],
  );

  return { current, languages: LANGUAGES, setLanguage };
}
