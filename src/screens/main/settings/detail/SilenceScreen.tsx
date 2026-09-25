import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  FeatureCard,
  NumberInput,
  Screen,
  ScreenHeader,
  ToggleSwitch,
  Typography,
} from '../../../../components';
import { AlertTriangleIcon, BellIcon } from '../../../../icons';
import { useTheme, type Theme } from '../../../../theme';
import { useEditGuard } from '../../useEditGuard';
import {
  SILENCE_TIMER_MAX,
  SILENCE_TIMER_MIN,
  useSilenceSettings,
} from './useSilenceSettings';

/**
 * Title over description with a control at the end.
 * Module scope, so the row keeps a stable identity across re-renders.
 */
function SilenceRow({
  theme,
  title,
  description,
  trailing,
}: {
  theme: Theme;
  title: string;
  description: string;
  trailing: React.ReactNode;
}) {
  const { colors, spacing } = theme;

  return (
    <View style={[styles.row, { gap: spacing.md }]}>
      <View style={styles.rowText}>
        <Typography
          variant="captionBold"
          size={16}
          align="left"
          color={colors.primary}
          numberOfLines={1}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          size={12}
          align="left"
          color={colors.textSecondary}
          style={{ marginTop: spacing.xs }}
        >
          {description}
        </Typography>
      </View>

      {trailing}
    </View>
  );
}

function Divider({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
  );
}

export function SilenceScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing } = theme;
  const { settings, setMode, setTimer, save, saving } = useSilenceSettings();
  const { requireStayMode } = useEditGuard();

  const handleSave = async () => {
    if (requireStayMode()) return;
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

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSubtle }]}>
      <ScreenHeader
        title={t('settings.options.silence.title')}
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
        <FeatureCard
          shadow="soft"
          icon={<AlertTriangleIcon size={20} color={colors.onPrimary} />}
          title={t('silence.fault.title')}
        >
          <SilenceRow
            theme={theme}
            title={t('silence.manual')}
            description={t('silence.fault.manualDescription')}
            trailing={
              <ToggleSwitch
                value={settings.faultMode === 'manual'}
                onValueChange={next =>
                  setMode('fault', next ? 'manual' : 'auto')
                }
                accessibilityLabel={`${t('silence.fault.title')} ${t(
                  'silence.manual',
                )}`}
              />
            }
          />

          <Divider theme={theme} />

          <SilenceRow
            theme={theme}
            title={t('silence.auto')}
            description={t('silence.fault.autoDescription')}
            trailing={
              <ToggleSwitch
                value={settings.faultMode === 'auto'}
                onValueChange={next =>
                  setMode('fault', next ? 'auto' : 'manual')
                }
                accessibilityLabel={`${t('silence.fault.title')} ${t(
                  'silence.auto',
                )}`}
              />
            }
          />

          {settings.faultMode === 'auto' && (
            <>
              <Divider theme={theme} />

              <SilenceRow
                theme={theme}
                title={t('silence.timer.title')}
                description={t('silence.timer.faultDescription')}
                trailing={
                  <NumberInput
                    value={settings.faultTimerSeconds}
                    onChange={next => setTimer('fault', next)}
                    min={SILENCE_TIMER_MIN}
                    max={SILENCE_TIMER_MAX}
                    unit={t('common.minutes')}
                    accessibilityLabel={`${t('silence.fault.title')} ${t(
                      'silence.timer.title',
                    )}`}
                  />
                }
              />
            </>
          )}
        </FeatureCard>

        <FeatureCard
          shadow="soft"
          icon={<BellIcon size={20} color={colors.onPrimary} />}
          title={t('silence.alarm.title')}
        >
          <SilenceRow
            theme={theme}
            title={t('silence.manual')}
            description={t('silence.alarm.manualDescription')}
            trailing={
              <ToggleSwitch
                value={settings.alarmMode === 'manual'}
                onValueChange={next =>
                  setMode('alarm', next ? 'manual' : 'auto')
                }
                accessibilityLabel={`${t('silence.alarm.title')} ${t(
                  'silence.manual',
                )}`}
              />
            }
          />

          <Divider theme={theme} />

          <SilenceRow
            theme={theme}
            title={t('silence.auto')}
            description={t('silence.alarm.autoDescription')}
            trailing={
              <ToggleSwitch
                value={settings.alarmMode === 'auto'}
                onValueChange={next =>
                  setMode('alarm', next ? 'auto' : 'manual')
                }
                accessibilityLabel={`${t('silence.alarm.title')} ${t(
                  'silence.auto',
                )}`}
              />
            }
          />

          {settings.alarmMode === 'auto' && (
            <>
              <Divider theme={theme} />

              <SilenceRow
                theme={theme}
                title={t('silence.timer.title')}
                description={t('silence.timer.alarmDescription')}
                trailing={
                  <NumberInput
                    value={settings.alarmTimerSeconds}
                    onChange={next => setTimer('alarm', next)}
                    min={SILENCE_TIMER_MIN}
                    max={SILENCE_TIMER_MAX}
                    unit={t('common.minutes')}
                    accessibilityLabel={`${t('silence.alarm.title')} ${t(
                      'silence.timer.title',
                    )}`}
                  />
                }
              />
            </>
          )}
        </FeatureCard>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: 1,
  },
});
