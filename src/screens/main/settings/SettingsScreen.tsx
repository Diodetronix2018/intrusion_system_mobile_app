import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Screen, Typography } from '../../../components';
import { useTheme } from '../../../theme';
import { SETTINGS_OPTIONS } from './options';
import { SettingsOptionCard } from './SettingsOptionCard';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  return (
    <Screen
      edges={['left', 'right']}
      background={colors.backgroundSoft}
      contentContainerStyle={{ gap: spacing.md }}
    >
      <Typography
        variant="screenTitle"
        lineHeight="120%"
        align="left"
        color={colors.primary}
        style={{ marginBottom: spacing.xs }}
      >
        {t('settings.configTitle')}
      </Typography>

      {SETTINGS_OPTIONS.map(option => (
        <SettingsOptionCard
          key={option.id}
          icon={option.icon}
          family={option.family}
          Svg={option.Svg}
          title={t(`settings.options.${option.id}.title`)}
          subtitle={t(`settings.options.${option.id}.subtitle`)}
          onPress={() =>
            navigation.navigate('SettingsDetail', { optionId: option.id })
          }
        />
      ))}
    </Screen>
  );
}
