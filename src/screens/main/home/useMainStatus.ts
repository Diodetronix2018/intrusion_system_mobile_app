import { useMemo } from 'react';

import { SBA_CONTROL_SHADOW } from '../../../config/awsConfig';
import { useShadowSubscription } from '../../../utils/useShadowSubscription';
import type { SubsystemKey } from './SystemStatusCard';
import type { SubsystemStatus } from './StatusTile';
import type { ArmMode } from './useMainControls';

/** Shape of `sba_control_v01`'s reported shadow document — only the fields this screen reads. */
export interface MainReportedStatus {
  /** 1 = Stay, 0 = Away — mirrors the `arm` field this screen publishes. */
  status?: number;
  /** Per-zone health, 9 entries (zones 1-8 then tamper): 0 normal, 1 warning, 2 alarm. */
  zon?: number[];
  ac_fail?: number;
  hooter_fail?: number;
  bat_fail?: number;
  /** 0 = no signal, 2 = full signal; anything else is in between. */
  signal?: number;
  /** ISO timestamp of this report. */
  ts?: string;
}

const TAMPER_INDEX = 8;

/** All-normal (0) -> success; any 1 (no 2s) -> warning; any 2 -> failed. */
function zoneAggregateStatus(zon?: number[]): SubsystemStatus {
  if (!zon || zon.length === 0) return 'success';
  if (zon.some(value => value === 2)) return 'failed';
  if (zon.some(value => value === 1)) return 'warning';
  return 'success';
}

/** 0 -> success, anything else -> failed (no warning tier for these subsystems). */
function binaryStatus(failFlag?: number): SubsystemStatus {
  return failFlag ? 'failed' : 'success';
}

function tamperStatus(zon?: number[]): SubsystemStatus {
  return binaryStatus(zon?.[TAMPER_INDEX]);
}

function signalStatus(signal?: number): SubsystemStatus {
  if (signal === 0) return 'failed';
  if (signal === 2) return 'success';
  return 'warning';
}

/**
 * Live status for the Main screen, read from `sba_control_v01`'s reported
 * shadow (the device's own periodic telemetry, delivered on
 * `.../update/accepted`) rather than published by this app.
 */
export function useMainStatus() {
  const { reported, connected } = useShadowSubscription<MainReportedStatus>(
    SBA_CONTROL_SHADOW,
  );

  return useMemo(() => {
    const armMode: ArmMode | null =
      reported?.status == null ? null : reported.status === 1 ? 'stay' : 'away';

    const statuses: Partial<Record<SubsystemKey, SubsystemStatus>> = {
      zone: zoneAggregateStatus(reported?.zon),
      battery: binaryStatus(reported?.bat_fail),
      // the device's `ac_fail` flag — the AC tile, not `bat_fail` again.
      ac: binaryStatus(reported?.ac_fail),
      hooter: binaryStatus(reported?.hooter_fail),
      tamper: tamperStatus(reported?.zon),
      signal: signalStatus(reported?.signal),
    };

    return { connected, armMode, timestamp: reported?.ts, statuses };
  }, [reported, connected]);
}
