import { useCallback, useEffect, useRef, useState } from 'react';

import { SBA_CONTROL_SHADOW } from '../../../config/awsConfig';
import { useIotShadowPublish } from '../../../utils/useIotShadowPublish';

const log = (...args: any[]) => console.log('[Main]', ...args);

export type ArmMode = 'stay' | 'away';
export type PartitionMode = 'all' | 'part';

const ARM_CODE: Record<ArmMode, number> = { stay: 0, away: 1 };
const PARTITION_CODE: Record<PartitionMode, number> = { all: 1, part: 2 };

/** Which single control is currently mid-publish, so only that card shows a spinner. */
export type PendingAction = 'arm' | 'mode' | 'mute' | 'reset' | null;

/**
 * How long to wait for the panel to confirm an arm or All/Part tap (via
 * `status`/`zen`) before giving up and letting the user try again.
 */
const ARM_CONFIRM_TIMEOUT_MS = 15000;
const PARTITION_CONFIRM_TIMEOUT_MS = 15000;

/**
 * Main-screen live controls, published immediately on every tap (there is
 * no "Save" step here — unlike the settings screens, which batch edits) to
 * the device's `sba_control_v01` shadow:
 *   - arm mode:       `{"state":{"desired":{"arm": 0|1}}}` (0 = Stay, 1 = Away)
 *   - all/part mode:  `{"state":{"desired":{"mod": 1|2}}}` (1 = All, 2 = Part)
 *   - mute:           `{"state":{"desired":{"sil": 1}}}`
 *   - reset:          `{"state":{"desired":{"rst": 1}}}`
 *
 * Which card is *highlighted*, for both arm mode and All/Part, is never a
 * local guess — only ever the panel's own reported state
 * (`reportedArmMode`/`reportedPartitionMode`, from `status`/`zen`). Someone
 * changing the mode directly on the physical panel has to show up here too,
 * which a "seed once from the device, then the app owns it" local copy
 * can't do — it only ever reflects taps made in this app. Tapping a card
 * doesn't flip it active immediately either; it publishes, shows a spinner,
 * and leaves the highlight exactly where it was until the panel's reported
 * state actually confirms the change (or a timeout gives up).
 */
export function useMainControls(
  reportedArmMode: ArmMode | null,
  reportedPartitionMode: PartitionMode | null,
) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const { publish, publishing } = useIotShadowPublish(SBA_CONTROL_SHADOW);

  const [pendingArmMode, setPendingArmMode] = useState<ArmMode | null>(null);
  const armConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pendingPartitionMode, setPendingPartitionMode] = useState<PartitionMode | null>(
    null,
  );
  const partitionConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingArmMode = useCallback(() => {
    if (armConfirmTimer.current) {
      clearTimeout(armConfirmTimer.current);
      armConfirmTimer.current = null;
    }
    setPendingArmMode(null);
  }, []);

  const clearPendingPartitionMode = useCallback(() => {
    if (partitionConfirmTimer.current) {
      clearTimeout(partitionConfirmTimer.current);
      partitionConfirmTimer.current = null;
    }
    setPendingPartitionMode(null);
  }, []);

  // The panel's own reported state caught up — stop waiting.
  useEffect(() => {
    if (pendingArmMode != null && reportedArmMode === pendingArmMode) {
      clearPendingArmMode();
    }
  }, [reportedArmMode, pendingArmMode, clearPendingArmMode]);

  useEffect(() => {
    if (pendingPartitionMode != null && reportedPartitionMode === pendingPartitionMode) {
      clearPendingPartitionMode();
    }
  }, [reportedPartitionMode, pendingPartitionMode, clearPendingPartitionMode]);

  useEffect(
    () => () => {
      if (armConfirmTimer.current) clearTimeout(armConfirmTimer.current);
      if (partitionConfirmTimer.current) clearTimeout(partitionConfirmTimer.current);
    },
    [],
  );

  const setArmMode = useCallback(
    async (mode: ArmMode) => {
      log(`COMMAND arm → ${mode} (arm: ${ARM_CODE[mode]})`);
      setPendingAction('arm');
      setPendingArmMode(mode);
      if (armConfirmTimer.current) clearTimeout(armConfirmTimer.current);
      armConfirmTimer.current = setTimeout(() => {
        armConfirmTimer.current = null;
        setPendingArmMode(null);
      }, ARM_CONFIRM_TIMEOUT_MS);

      try {
        await publish({ arm: ARM_CODE[mode] });
        log(`COMMAND arm OK → ${mode} — waiting for status to confirm`);
      } catch (e: any) {
        log(`COMMAND arm FAILED → ${mode}:`, e?.message);
        clearPendingArmMode();
        throw e;
      } finally {
        setPendingAction(null);
      }
    },
    [publish, clearPendingArmMode],
  );

  const setPartitionMode = useCallback(
    async (mode: PartitionMode) => {
      log(`COMMAND mode → ${mode} (mod: ${PARTITION_CODE[mode]})`);
      setPendingAction('mode');
      setPendingPartitionMode(mode);
      if (partitionConfirmTimer.current) clearTimeout(partitionConfirmTimer.current);
      partitionConfirmTimer.current = setTimeout(() => {
        partitionConfirmTimer.current = null;
        setPendingPartitionMode(null);
      }, PARTITION_CONFIRM_TIMEOUT_MS);

      try {
        await publish({ mod: PARTITION_CODE[mode] });
        log(`COMMAND mode OK → ${mode} — waiting for zen to confirm`);
      } catch (e: any) {
        log(`COMMAND mode FAILED → ${mode}:`, e?.message);
        clearPendingPartitionMode();
        throw e;
      } finally {
        setPendingAction(null);
      }
    },
    [publish, clearPendingPartitionMode],
  );

  const mute = useCallback(async () => {
    log('COMMAND mute (sil: 1)');
    setPendingAction('mute');
    try {
      await publish({ sil: 1 });
      log('COMMAND mute OK');
    } catch (e: any) {
      log('COMMAND mute FAILED:', e?.message);
      throw e;
    } finally {
      setPendingAction(null);
    }
  }, [publish]);

  const reset = useCallback(async () => {
    log('COMMAND reset (rst: 1)');
    setPendingAction('reset');
    try {
      await publish({ rst: 1 });
      log('COMMAND reset OK');
    } catch (e: any) {
      log('COMMAND reset FAILED:', e?.message);
      throw e;
    } finally {
      setPendingAction(null);
    }
  }, [publish]);

  return {
    setArmMode,
    /** True from the tap until `status` confirms it (or the timeout gives
     *  up) — locks both Stay and Away cards, not just the tapped one. */
    armCommandPending: pendingArmMode != null,
    /** True only for the direction actually awaiting confirmation, for its spinner. */
    armLoading: {
      stay: pendingArmMode === 'stay',
      away: pendingArmMode === 'away',
    },
    setPartitionMode,
    /** Same guard as `armCommandPending`, for All/Part. */
    partitionCommandPending: pendingPartitionMode != null,
    partitionLoading: {
      all: pendingPartitionMode === 'all',
      part: pendingPartitionMode === 'part',
    },
    mute,
    reset,
    pendingAction,
    /** True while any of the above is in flight — guards against overlapping publishes. */
    saving: publishing,
  };
}
