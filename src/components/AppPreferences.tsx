import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageCode } from '../i18n';
import { useLanguage } from '../i18n/useLanguage';
import { ThemeMode, useThemeContext } from '../theme';
import { OptionSheet } from './OptionSheet';
import { PreferenceCard } from './PreferenceCard';

const THEME_MODES: { mode: ThemeMode; labelKey: string }[] = [
  { mode: 'light', labelKey: 'settings.themeLight' },
  { mode: 'dark', labelKey: 'settings.themeDark' },
  { mode: 'system', labelKey: 'settings.themeSystem' },
];

/** Theme card + its picker sheet. */
export function ThemeCard() {
  const { t } = useTranslation();
  const { mode, setMode } = useThemeContext();
  const [open, setOpen] = useState(false);

  const currentLabel = t(
    THEME_MODES.find(item => item.mode === mode)?.labelKey ??
      'settings.themeSystem',
  );

  return (
    <>
      <PreferenceCard
        icon="color-palette-outline"
        title={t('profile.appTheme')}
        subtitle={t('profile.themeSubtitle')}
        value={currentLabel}
        onPress={() => setOpen(true)}
      />

      <OptionSheet<ThemeMode>
        visible={open}
        title={t('profile.selectTheme')}
        selected={mode}
        onSelect={setMode}
        onClose={() => setOpen(false)}
        options={THEME_MODES.map(item => ({
          value: item.mode,
          label: t(item.labelKey),
        }))}
      />
    </>
  );
}

/** Language card + its picker sheet. */
export function LanguageCard() {
  const { t } = useTranslation();
  const { current, languages, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PreferenceCard
        icon="language-outline"
        title={t('profile.appLanguage')}
        subtitle={t('profile.languageSubtitle')}
        value={current.label}
        onPress={() => setOpen(true)}
      />

      <OptionSheet<LanguageCode>
        visible={open}
        title={t('profile.selectLanguage')}
        selected={current.code}
        onSelect={setLanguage}
        onClose={() => setOpen(false)}
        options={languages.map(language => ({
          value: language.code,
          label: language.label,
          hint: language.short,
        }))}
      />
    </>
  );
}
