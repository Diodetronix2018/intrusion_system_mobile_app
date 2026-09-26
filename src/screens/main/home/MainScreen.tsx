import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { OptionSheet, Screen } from '../../../components';
import { useSession } from '../../../session/SessionProvider';
import { useTheme } from '../../../theme';
import { useIotConnection } from '../../../utils/IotConnection';
import { useResponsive } from '../../../utils/responsive';
import { useEvents } from '../events';
import { ConnectionBanner } from './ConnectionBanner';
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

/** How often the "Last sync …" label re-renders, so it keeps counting up. */
const AGO_REFRESH_MS = 60000;

/**
 * The device's reported `ts` as a relative age in the largest whole unit:
 * "just now" under a minute, then minutes, hours, days, months and years
 * ("10 mins ago", "1 hr ago", "3 days ago", …).
 */
function formatAgo(
  t: (key: string, opts?: any) => string,
  ts: string,
  now: number,
): string {
  const parsed = Date.parse(ts);
  // an unparseable or future `ts` (device clock ahead) reads as fresh
  const minutes = Number.isNaN(parsed)
    ? 0
    : Math.max(0, Math.floor((now - parsed) / 60000));
  if (minutes < 1) return t('main.status.justNow');
  if (minutes < 60) return t('main.status.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('main.status.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('main.status.daysAgo', { count: days });
  const months = Math.floor(days / 30);
  if (months < 12) return t('main.status.monthsAgo', { count: months });
  return t('main.status.yearsAgo', { count: Math.floor(days / 365) });
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
  const { reconnect } = useIotConnection();
  const { session, switchDevice } = useSession();
  const [deviceSheetOpen, setDeviceSheetOpen] = useState(false);
  const devices = session?.devices ?? [];

  // Ticks once a minute so the relative "Last sync" age stays current even
  // when no new report arrives.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), AGO_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const summary = timestamp
    ? t('main.status.summary', { ago: formatAgo(t, timestamp, now) })
    : t('main.status.connecting');

  // A command that failed because the device connection is down gets a
  // tap-to-reconnect toast instead of a dead end.
  const reportError = (err: unknown) => {
    const offline = !connected;
    Toast.show({
      type: 'error',
      text1: t('common.configurationFailed'),
      text2: offline
        ? t('main.connection.tapToReconnect')
        : (err as any)?.message,
      onPress: offline
        ? () => {
            Toast.hide();
            reconnect();
          }
        : undefined,
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

        {/* only renders while the device connection is down */}
        <ConnectionBanner
          style={{ marginHorizontal: gutter, marginTop: spacing.lg }}
        />

        <View style={{ paddingHorizontal: gutter, paddingTop: spacing.xl }}>
          {/* Stay/Away as one segmented track — the current mode is the
              filled segment */}
          <View
            style={[
              styles.modes,
              {
                padding: spacing.xs,
                gap: spacing.xs,
                backgroundColor: colors.primaryMuted,
                borderColor: colors.border,
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
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});
