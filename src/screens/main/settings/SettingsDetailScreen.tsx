import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Screen, ScreenHeader, Typography } from '../../../components';
import { useTheme } from '../../../theme';
import type { RootStackScreenProps } from '../../../navigation/types';
import { findSettingsOption, SettingsOption } from './options';
import { PartSettingScreen } from './detail/PartSettingScreen';
import { RelayScreen } from './detail/RelayScreen';
import { AutoArmScreen } from './detail/AutoArmScreen';
import { SilenceScreen } from './detail/SilenceScreen';
import { SpecialNotifyScreen } from './detail/SpecialNotifyScreen';
import { RepeatScreen } from './detail/RepeatScreen';

/**
 * Shared body for the six configuration screens until each gets its own
 * implementation — the route already carries which option was tapped.
 */
export function SettingsDetailScreen({
  route,
}: RootStackScreenProps<'SettingsDetail'>) {
  const option = findSettingsOption(route.params.optionId);

  if (option.id === 'partSetting') {
    return <PartSettingScreen />;
  }

  if (option.id === 'relay') {
    return <RelayScreen />;
  }

  if (option.id === 'repeat') {
    return <RepeatScreen />;
  }

  if (option.id === 'autoArm') {
    return <AutoArmScreen />;
  }

  if (option.id === 'specialNotify') {
    return <SpecialNotifyScreen />;
  }

  if (option.id === 'silence') {
    return <SilenceScreen />;
  }

  return <SettingsPlaceholder option={option} />;
}

/** Stand-in for the configuration screens that are not built yet. */
function SettingsPlaceholder({ option }: { option: SettingsOption }) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  const title = t(`settings.options.${option.id}.title`);

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSoft }]}>
      <ScreenHeader title={title} background={colors.backgroundSoft} />

      <Screen
        edges={['left', 'right']}
        background={colors.backgroundSoft}
        scrollable={false}
      >
        <View style={styles.center}>
          <View
            style={[
              styles.iconWell,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.lg,
                marginBottom: spacing.xl,
              },
            ]}
          >
            {option.Svg ? (
              <option.Svg width={30} height={30} />
            ) : (
              <Icon
                name={option.icon ?? 'ellipse-outline'}
                family={option.family}
                size={30}
                color={colors.onPrimary}
              />
            )}
          </View>

          <Typography variant="cardTitle" size={17} color={colors.primary}>
            {title}
          </Typography>

          <Typography
            variant="caption"
            size={13}
            color={colors.textSecondary}
            style={{ marginTop: spacing.sm }}
          >
            {t(`settings.options.${option.id}.subtitle`)}
          </Typography>

          <Typography
            variant="cardSubtitle"
            color={colors.textMuted}
            style={{ marginTop: spacing.xl }}
          >
            {t('settings.comingSoon')}
          </Typography>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWell: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
