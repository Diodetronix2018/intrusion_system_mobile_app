import React, { useState } from 'react';
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
import type { SubsystemKey } from './SystemStatusCard';
import { LatestActivityCard } from './LatestActivityCard';
import { useEditGuard } from '../useEditGuard';
import { useMainControls } from './useMainControls';
import { useMainStatus } from './useMainStatus';

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
  } = useMainStatus();
  const {
    setArmMode,
    armCommandPending,
    armLoading,
    setPartitionMode,
    partitionCommandPending,
    partitionLoading,
    mute,
    reset,
    pendingAction,
    saving,
  } = useMainControls(reportedArmMode, reportedPartitionMode);
  const { events: latestEvents } = useEvents();
  const { requireStayMode } = useEditGuard();
  const { session, switchDevice } = useSession();
  const [deviceSheetOpen, setDeviceSheetOpen] = useState(false);
  const devices = session?.devices ?? [];

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

  // Zone/Tamper open the full per-zone breakdown; every other tile jumps to
  // the Events tab pre-filtered to whatever category actually explains it.
  const handlePressSystemTile = (key: SubsystemKey) => {
    switch (key) {
      case 'zone':
      case 'tamper':
        navigation.navigate('ZoneDetails');
        return;
      case 'battery':
        navigation.navigate('Tabs', {
          screen: 'Events',
          params: { filter: 'battery' },
        });
        return;
      case 'ac':
      case 'signal':
        navigation.navigate('Tabs', {
          screen: 'Events',
          params: { filter: 'powerFail' },
        });
        return;
      case 'hooter':
        navigation.navigate('Tabs', {
          screen: 'Events',
          params: { filter: 'hooterFail' },
        });
        return;
    }
  };

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
            mode={reportedArmMode ?? 'stay'}
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
            // Only ever the panel's own confirmed state (`status`) — a tap
            // never flips this immediately, it waits for that to change.
            active={reportedArmMode === 'stay'}
            loading={armLoading.stay}
            disabled={armCommandPending}
            onPress={() => runCommand(() => setArmMode('stay'))}
            glyph={HomeGlyph}
          />
          <ModeCard
            label={t('main.modes.away')}
            active={reportedArmMode === 'away'}
            loading={armLoading.away}
            disabled={armCommandPending}
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
            onPress={() => {
              if (requireStayMode()) return;
              runCommand(reset);
            }}
          />
        </View>

        <View style={{ paddingHorizontal: gutter, paddingTop: spacing.xl }}>
          <SystemStatusCard
            statuses={statuses}
            onPressTile={handlePressSystemTile}
          />
        </View>

        <View style={{ paddingHorizontal: gutter, paddingTop: spacing.lg }}>
          {/* a preview; the full log lives on the Events tab */}
          <LatestActivityCard
            entries={latestEvents.slice(0, 5)}
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
