import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { OptionSheet, Screen } from '../../../components';
import { PanelPasswordModal } from '../../device/PanelPasswordModal';
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
import { SwitchingDeviceOverlay } from './SwitchingDeviceOverlay';
import { SystemStatusCard } from './SystemStatusCard';
import type { SubsystemKey } from './SystemStatusCard';
import { LatestActivityCard } from './LatestActivityCard';
import { useEditGuard } from '../useEditGuard';
import { useMainControls } from './useMainControls';
import { useMainStatus } from './useMainStatus';

/** How often the "Last sync …" label re-renders, so it keeps counting up. */
const AGO_REFRESH_MS = 60000;

/**
 * How long a refresh waits for a fresh shadow document before reporting it
 * failed — long enough to cover a reconnect when tapped while offline.
 */
const REFRESH_TIMEOUT_MS = 10000;

/**
 * After a device switch, the loader stays up this much longer once the new
 * device's state has arrived, so the screen settles before it's usable.
 */
const SWITCH_SETTLE_MS = 1000;

/**
 * After a new device report, wait this long before re-pulling Latest
 * Activity — the Lambda writes the history row just after the shadow update.
 */
const EVENTS_REFETCH_DELAY_MS = 3000;

/** Gives up on a device switch (with an error toast) after this long. */
const SWITCH_TIMEOUT_MS = 15000;

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
    zoneChips,
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
  const {
    events: latestEvents,
    loading: eventsLoading,
    error: eventsError,
    refresh: refreshEvents,
  } = useEvents();
  const { requireStayMode } = useEditGuard();
  const { reconnect, refresh, controlReported, syncedThingName } =
    useIotConnection();

  // The Main tab stays mounted, so its one fetch on mount goes stale — re-pull
  // Latest Activity whenever the tab is shown and after every device report.
  useFocusEffect(useCallback(() => refreshEvents(), [refreshEvents]));
  useEffect(() => {
    if (!controlReported) return;
    const id = setTimeout(refreshEvents, EVENTS_REFETCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [controlReported, refreshEvents]);

  // Spins from the tap until the refreshed shadow document lands (the
  // reported object is replaced on every message) or the timeout passes,
  // then says which it was. The ref lets the arrival effect below read it
  // without re-running (and falsely "succeeding") when a refresh starts.
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const setRefreshingState = (value: boolean) => {
    refreshingRef.current = value;
    setRefreshing(value);
  };
  const onRefresh = () => {
    setRefreshingState(true);
    if (!connected) {
      Toast.show({
        type: 'info',
        text1: t('main.connection.bannerReconnecting'),
      });
    }
    refresh();
  };
  useEffect(() => {
    if (!refreshingRef.current) return;
    setRefreshingState(false);
    Toast.show({
      type: 'success',
      text1: t('main.status.refreshed'),
      text2: t('main.status.refreshedBody'),
    });
    // only a new document should end a refresh, not a re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlReported]);
  useEffect(() => {
    if (!refreshing) return;
    const id = setTimeout(() => {
      setRefreshingState(false);
      Toast.show({
        type: 'error',
        text1: t('main.status.refreshFailed'),
        text2: t('main.status.refreshFailedBody'),
      });
    }, REFRESH_TIMEOUT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);
  const { session, switchDevice, unlockedThings } = useSession();
  const [deviceSheetOpen, setDeviceSheetOpen] = useState(false);
  const devices = session?.devices ?? [];

  // The device a switch is waiting on — non-null shows the blocking loader
  // until that device is connected and its state is in (+ a short settle),
  // so Stay/Away can't be sent before the new connection is ready.
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const startSwitch = (thingName: string) => {
    setSwitchingTo(thingName);
    switchDevice(thingName);
  };
  // A device not unlocked yet this run asks for its panel password first.
  const [unlockTarget, setUnlockTarget] = useState<string | null>(null);
  const onSelectDevice = (thingName: string) => {
    if (thingName === session?.activeThingName) return;
    if (unlockedThings.has(thingName)) {
      startSwitch(thingName);
    } else {
      setUnlockTarget(thingName);
    }
  };
  useEffect(() => {
    if (!switchingTo) return;
    if (syncedThingName === switchingTo) {
      const id = setTimeout(() => setSwitchingTo(null), SWITCH_SETTLE_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setSwitchingTo(null);
      Toast.show({
        type: 'error',
        text1: t('main.switchDevice.failed'),
        text2: t('main.switchDevice.failedBody'),
      });
    }, SWITCH_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [switchingTo, syncedThingName, t]);

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

  // Zone/Tamper open the full per-zone breakdown; Battery, AC and Hooter jump
  // to the Events tab pre-filtered to whatever category explains them.
  // Signal is display-only (see `SystemStatusCard`) and never lands here.
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
            onRefresh={onRefresh}
            refreshing={refreshing}
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
            // All/Part changes the panel's zone setup, so like the settings
            // pages it's Stay-only; Mute and Reset work in either mode.
            onPress={() => {
              if (requireStayMode()) return;
              runCommand(() => setPartitionMode('all'));
            }}
          />
          <QuickActionCard
            label={t('main.actions.part')}
            glyph={PartGlyph}
            active={reportedPartitionMode === 'part'}
            loading={partitionLoading.part}
            disabled={partitionCommandPending}
            onPress={() => {
              if (requireStayMode()) return;
              runCommand(() => setPartitionMode('part'));
            }}
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
          <SystemStatusCard
            statuses={statuses}
            zoneChips={zoneChips}
            onPressTile={handlePressSystemTile}
          />
        </View>

        <View style={{ paddingHorizontal: gutter, paddingTop: spacing.lg }}>
          {/* a preview; the full log lives on the Events tab */}
          <LatestActivityCard
            entries={latestEvents.slice(0, 5)}
            loading={eventsLoading}
            error={!!eventsError}
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
        onSelect={onSelectDevice}
        onClose={() => setDeviceSheetOpen(false)}
      />

      <PanelPasswordModal
        thingName={unlockTarget}
        onCancel={() => setUnlockTarget(null)}
        onUnlocked={() => {
          const target = unlockTarget;
          setUnlockTarget(null);
          if (target) startSwitch(target);
        }}
      />

      <SwitchingDeviceOverlay thingName={switchingTo} />
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
