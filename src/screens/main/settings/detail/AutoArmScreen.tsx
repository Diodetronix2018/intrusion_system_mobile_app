import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  FeatureCard,
  formatTime,
  Icon,
  Screen,
  ScreenHeader,
  TimePicker,
  ToggleSwitch,
  Typography,
} from '../../../../components';
import { InfoIcon } from '../../../../icons';
import { useTheme } from '../../../../theme';
import { useAutoArm } from './useAutoArm';

export function AutoArmScreen() {
  const { t } = useTranslation();
  const { colors, radius, spacing, softShadow } = useTheme();
  const { enabled, setEnabled, time, setTime, save, saving } = useAutoArm();

  const handleSave = async () => {
    try {
      await save();
      Toast.show({ type: 'success', text1: t('common.configurationSaved') });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('common.configurationFailed'),
        text2: err?.message,
      });
    }
  };

  const card = (children: React.ReactNode) => (
    <View
      style={[
        styles.card,
        {
          padding: spacing.lg,
          gap: spacing.md,
          borderRadius: radius.md,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        softShadow,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSubtle }]}>
      <ScreenHeader
        title={t('settings.options.autoArm.title')}
        background={colors.backgroundSubtle}
      />

      <Screen
        edges={['left', 'right']}
        background={colors.backgroundSubtle}
        contentContainerStyle={{ gap: spacing.md }}
        footer={
          <Button
            title={t('common.saveConfiguration')}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        }
      >
        <Typography
          variant="caption"
          size={13}
          align="left"
          color={colors.textSecondary}
          style={{ marginBottom: spacing.xs }}
        >
          {t('settings.options.autoArm.subtitle')}
        </Typography>

        <FeatureCard
          shadow="soft"
          icon={<Icon name="time-outline" size={20} color={colors.onPrimary} />}
          title={t('autoArm.title')}
          description={t('autoArm.description')}
          trailing={
            <ToggleSwitch
              value={enabled}
              onValueChange={setEnabled}
              accessibilityLabel={t('autoArm.title')}
            />
          }
        />

        {enabled && card(
          <>
            <Typography
              variant="captionBold"
              size={16}
              align="left"
              color={colors.primary}
            >
              {t('autoArm.setTime')}
            </Typography>

            <TimePicker
              value={time}
              onChange={setTime}
              accessibilityLabel={t('autoArm.setTime')}
            />

            <View style={[styles.info, { gap: spacing.sm }]}>
              <InfoIcon size={14} color={colors.textSecondary} />
              <Typography
                variant="caption"
                size={12}
                align="left"
                color={colors.textSecondary}
                style={styles.infoText}
              >
                {t('autoArm.info', { time: formatTime(time) })}
              </Typography>
            </View>
          </>,
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    minWidth: 0,
  },
});
