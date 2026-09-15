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
  const { settings, setToggle, setTimer } = useSilenceSettings();

  const handleSave = () => {
    // no panel API yet; confirm the action so the button is not a dead end
    Toast.show({ type: 'success', text1: t('common.configurationSaved') });
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
          <Button title={t('common.saveConfiguration')} onPress={handleSave} />
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
                value={settings.faultManual}
                onValueChange={next => setToggle('faultManual', next)}
                accessibilityLabel={`${t('silence.fault.title')} ${t('silence.manual')}`}
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
                value={settings.faultAuto}
                onValueChange={next => setToggle('faultAuto', next)}
                accessibilityLabel={`${t('silence.fault.title')} ${t('silence.auto')}`}
              />
            }
          />
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
                value={settings.alarmManual}
                onValueChange={next => setToggle('alarmManual', next)}
                accessibilityLabel={`${t('silence.alarm.title')} ${t('silence.manual')}`}
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
                value={settings.alarmAuto}
                onValueChange={next => setToggle('alarmAuto', next)}
                accessibilityLabel={`${t('silence.alarm.title')} ${t('silence.auto')}`}
              />
            }
          />

          <Divider theme={theme} />

          <SilenceRow
            theme={theme}
            title={t('silence.timer.title')}
            description={t('silence.timer.description')}
            trailing={
              <NumberInput
                value={settings.timerSeconds}
                onChange={setTimer}
                min={SILENCE_TIMER_MIN}
                max={SILENCE_TIMER_MAX}
                unit={t('common.seconds')}
                accessibilityLabel={t('silence.timer.title')}
              />
            }
          />
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
