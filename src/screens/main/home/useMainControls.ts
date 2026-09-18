import { useCallback, useState } from 'react';

import { SBA_CONTROL_SHADOW } from '../../../config/awsConfig';
import { useIotShadowPublish } from '../../../utils/useIotShadowPublish';

const log = (...args: any[]) => console.log('[Main]', ...args);

export type ArmMode = 'stay' | 'away';
export type PartitionMode = 'all' | 'part';

const ARM_CODE: Record<ArmMode, number> = { stay: 1, away: 0 };
const PARTITION_CODE: Record<PartitionMode, number> = { all: 1, part: 2 };

/** Which single control is currently mid-publish, so only that card shows a spinner. */
export type PendingAction = 'arm' | 'mode' | 'mute' | 'reset' | null;

/**
 * Main-screen live controls, published immediately on every tap (there is
 * no "Save" step here — unlike the settings screens, which batch edits) to
 * the device's `sba_control_v01` shadow:
 *   - arm mode:       `{"state":{"desired":{"arm": 1|0}}}` (1 = Stay, 0 = Away)
 *   - all/part mode:  `{"state":{"desired":{"mod": 1|2}}}` (1 = All, 2 = Part)
 *   - mute:           `{"state":{"desired":{"sil": 1}}}`
 *   - reset:          `{"state":{"desired":{"rst": 1}}}`
 *
 * Local state only changes once the publish is acknowledged, so a failed
 * command leaves the previously-active card highlighted rather than
 * optimistically flipping to a state the device never actually reached.
 */
export function useMainControls() {
  const [armMode, setArmModeState] = useState<ArmMode>('stay');
  const [partitionMode, setPartitionModeState] = useState<PartitionMode>('all');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const { publish, publishing } = useIotShadowPublish(SBA_CONTROL_SHADOW);

  const setArmMode = useCallback(
    async (mode: ArmMode) => {
      log(`COMMAND arm → ${mode} (arm: ${ARM_CODE[mode]})`);
      setPendingAction('arm');
      try {
        await publish({ arm: ARM_CODE[mode] });
        log(`COMMAND arm OK → ${mode}`);
        setArmModeState(mode);
      } catch (e: any) {
        log(`COMMAND arm FAILED → ${mode}:`, e?.message);
        throw e;
      } finally {
        setPendingAction(null);
      }
    },
    [publish],
  );

  /**
   * Seeds `armMode` from the device's own reported status (`useMainStatus`)
   * — no publish, so prepopulating from a live report never echoes straight
   * back to the device as a new desired state.
   */
  const setArmModeFromDevice = useCallback((mode: ArmMode) => {
    setArmModeState(mode);
  }, []);

  const setPartitionMode = useCallback(
    async (mode: PartitionMode) => {
      log(`COMMAND mode → ${mode} (mod: ${PARTITION_CODE[mode]})`);
      setPendingAction('mode');
      try {
        await publish({ mod: PARTITION_CODE[mode] });
        log(`COMMAND mode OK → ${mode}`);
        setPartitionModeState(mode);
      } catch (e: any) {
        log(`COMMAND mode FAILED → ${mode}:`, e?.message);
        throw e;
      } finally {
        setPendingAction(null);
      }
    },
    [publish],
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
    armMode,
    setArmMode,
    setArmModeFromDevice,
    partitionMode,
    setPartitionMode,
    mute,
    reset,
    pendingAction,
    /** True while any of the above is in flight — guards against overlapping publishes. */
    saving: publishing,
  };
}
