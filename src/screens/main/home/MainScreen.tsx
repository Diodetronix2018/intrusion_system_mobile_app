import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { OptionSheet, Screen } from '../../../components';
import { useSession } from '../../../session/SessionProvider';
import { useTheme } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { useEvents } from '../events';
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
  const minutes = Math.max(
    0,
    Math.round((Date.now() - Date.parse(ts)) / 60000),
  );
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
    connected,
    armMode: reportedArmMode,
    partitionMode: reportedPartitionMode,
    timestamp,
    statuses,
    zones,
  } = useMainStatus();
  const {
    armMode,
    setArmMode,
    setArmModeFromDevice,
    setPartitionMode,
    partitionCommandPending,
    partitionLoading,
    mute,
    reset,
    pendingAction,
    saving,
  } = useMainControls(reportedPartitionMode);
  const { events: latestEvents } = useEvents();
  const { session, switchDevice } = useSession();
  const [deviceSheetOpen, setDeviceSheetOpen] = useState(false);
  const devices = session?.devices ?? [];

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
    <>
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
          <StatusCard
            mode={armMode}
            summary={summary}
            online={connected}
            onSwitchDevice={
              devices.length > 1 ? () => setDeviceSheetOpen(true) : undefined
            }
          />
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
            // Only ever the panel's own confirmed state (`zen`) — a tap
            // never flips this immediately, it waits for that to change.
            active={reportedPartitionMode === 'all'}
            loading={partitionLoading.all}
            disabled={partitionCommandPending}
            onPress={() => runCommand(() => setPartitionMode('all'))}
          />
          <QuickActionCard
            label={t('main.actions.part')}
            glyph={PartGlyph}
            active={reportedPartitionMode === 'part'}
            loading={partitionLoading.part}
            disabled={partitionCommandPending}
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
            entries={latestEvents.slice(0, 2)}
            onViewAll={() => navigation.navigate('Tabs', { screen: 'Events' })}
          />
        </View>
      </Screen>

      <OptionSheet
        visible={deviceSheetOpen}
        title={t('main.switchDevice.title')}
        options={devices.map(thingName => ({
          value: thingName,
          label: thingName,
        }))}
        selected={session?.activeThingName ?? ''}
        onSelect={switchDevice}
        onClose={() => setDeviceSheetOpen(false)}
      />
    </>
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
