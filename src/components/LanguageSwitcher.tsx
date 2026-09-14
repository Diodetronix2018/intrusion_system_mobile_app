import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LanguageCode } from '../i18n';
import { useLanguage } from '../i18n/useLanguage';
import { useTheme } from '../theme';
import { Typography } from './Typography';

/** Compact EN / हि / த segmented control. */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const { current, languages, setLanguage } = useLanguage();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('a11y.selectLanguage')}
      style={[
        styles.group,
        {
          backgroundColor: colors.inputBackground,
          borderColor: colors.border,
          borderRadius: radius.full,
        },
      ]}
    >
      {languages.map(language => {
        const isActive = language.code === current.code;
        const fill = {
          backgroundColor: isActive ? colors.primary : 'transparent',
        };
        return (
          <Pressable
            key={language.code}
            onPress={() => setLanguage(language.code as LanguageCode)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={language.label}
            style={[
              styles.item,
              { borderRadius: radius.full, paddingHorizontal: spacing.md },
              fill,
            ]}
          >
            <Typography
              variant="caption"
              size={12}
              weight={isActive ? '700' : '400'}
              color={isActive ? colors.onPrimary : colors.textSecondary}
            >
              {language.short}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 3,
  },
  item: {
    minWidth: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
