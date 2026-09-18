import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Screen } from '../../../components';
import { useTheme } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { HomeAwayGlyph, HomeGlyph } from './ModeGlyphs';
import { ModeCard } from './ModeCard';
import { QuickActionCard } from './QuickActionCard';
import {
  AllGlyph,
  MuteGlyph,
  PartGlyph,
  ResetGlyph,
} from './QuickActionGlyphs';
import { StatusCard } from './StatusCard';
import { SystemStatusCard } from './SystemStatusCard';
import { LatestActivityCard } from './LatestActivityCard';
import { useMainControls } from './useMainControls';
import { useMainStatus } from './useMainStatus';
import { ZoneStatusCard } from './ZoneStatusCard';

/** "just now" under a minute, otherwise "{{count}}m ago" — from the device's reported `ts`. */
function formatAgo(t: (key: string, opts?: any) => string, ts: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(ts)) / 60000));
  return minutes < 1
    ? t('main.status.justNow')
    : t('main.status.minutesAgo', { count: minutes });
}

export function MainScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { gutter } = useResponsive();
  const navigation = useNavigation();
  const {
    armMode,
    setArmMode,
    setArmModeFromDevice,
    partitionMode,
    setPartitionMode,
    mute,
    reset,
    pendingAction,
    saving,
  } = useMainControls();
  const {
    connected,
    armMode: reportedArmMode,
    timestamp,
    statuses,
    zones,
  } = useMainStatus();

  // Prepopulate the Stay/Away selection from the device's own reported
  // status, once — after that, the user's own taps (already reflected
  // optimistically by useMainControls) stay authoritative.
  const seededArmMode = useRef(false);
  useEffect(() => {
    if (!seededArmMode.current && reportedArmMode) {
      setArmModeFromDevice(reportedArmMode);
      seededArmMode.current = true;
    }
  }, [reportedArmMode, setArmModeFromDevice]);

  const summary = timestamp
    ? t('main.status.summary', { ago: formatAgo(t, timestamp) })
    : t('main.status.connecting');

  const reportError = (err: unknown) => {
    Toast.show({
      type: 'error',
      text1: t('common.configurationFailed'),
      text2: (err as any)?.message,
    });
  };

  const reportSent = () => {
    Toast.show({ type: 'success', text1: t('common.commandSent') });
  };

  const runCommand = (action: () => Promise<void>) =>
    action().then(reportSent).catch(reportError);

  return (
    <Screen
      edges={['left', 'right']}
      background={colors.background}
      // the status band runs edge to edge, so the gutter moves inside it
      padded={false}
    >
      <View
        style={[
          styles.statusBand,
          {
            backgroundColor: colors.backgroundSoft,
            paddingHorizontal: gutter,
            paddingBottom: spacing.lg,
          },
        ]}
      >
        <StatusCard mode={armMode} summary={summary} online={connected} />
      </View>

      <View
        style={[
          styles.modes,
          {
            paddingHorizontal: gutter,
            paddingTop: spacing.xl,
            gap: spacing.md,
          },
        ]}
      >
        <ModeCard
          label={t('main.modes.stay')}
          active={armMode === 'stay'}
          loading={pendingAction === 'arm' && armMode !== 'stay'}
          disabled={saving}
          onPress={() => runCommand(() => setArmMode('stay'))}
          glyph={HomeGlyph}
        />
        <ModeCard
          label={t('main.modes.away')}
          active={armMode === 'away'}
          loading={pendingAction === 'arm' && armMode !== 'away'}
          disabled={saving}
          onPress={() => runCommand(() => setArmMode('away'))}
          glyph={HomeAwayGlyph}
        />
      </View>

      <View
        style={[
          styles.actions,
          {
            paddingHorizontal: gutter,
            paddingTop: spacing.lg,
            gap: spacing.sm,
          },
        ]}
      >
        <QuickActionCard
          label={t('main.actions.all')}
          glyph={AllGlyph}
          active={partitionMode === 'all'}
          loading={pendingAction === 'mode' && partitionMode !== 'all'}
          disabled={saving}
          onPress={() => runCommand(() => setPartitionMode('all'))}
        />
        <QuickActionCard
          label={t('main.actions.part')}
          glyph={PartGlyph}
          active={partitionMode === 'part'}
          loading={pendingAction === 'mode' && partitionMode !== 'part'}
          disabled={saving}
          onPress={() => runCommand(() => setPartitionMode('part'))}
        />
        <QuickActionCard
          label={t('main.actions.mute')}
          glyph={MuteGlyph}
          loading={pendingAction === 'mute'}
          disabled={saving}
          onPress={() => runCommand(mute)}
        />
        <QuickActionCard
          label={t('main.actions.reset')}
          glyph={ResetGlyph}
          loading={pendingAction === 'reset'}
          disabled={saving}
          onPress={() => runCommand(reset)}
        />
      </View>

      <View style={{ paddingHorizontal: gutter, paddingTop: spacing.xl }}>
        <SystemStatusCard statuses={statuses} />
      </View>

      <View style={{ paddingHorizontal: gutter, paddingTop: spacing.lg }}>
        {/* a preview of zone 1 only; the full 9-line breakdown is "View all" */}
        <ZoneStatusCard
          zones={
            zones[0]?.number
              ? [
                  {
                    number: zones[0].number,
                    location: zones[0].configured
                      ? zones[0].location
                      : t('zone.notConfigured'),
                    condition: zones[0].status,
                  },
                ]
              : []
          }
          onViewAll={() => navigation.navigate('ZoneDetails')}
        />
      </View>

      <View style={{ paddingHorizontal: gutter, paddingTop: spacing.lg }}>
        {/* a preview; the full log lives on the Events tab */}
        <LatestActivityCard
          entries={[
            {
              id: '1',
              time: '18:12:11',
              eventKey: 'alarm',
              zoneNumber: 1,
              locationKey: 'mainDoor',
              severity: 'alarm',
            },
          ]}
          onViewAll={() => navigation.navigate('Tabs', { screen: 'Events' })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusBand: {
    width: '100%',
  },
  modes: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});
