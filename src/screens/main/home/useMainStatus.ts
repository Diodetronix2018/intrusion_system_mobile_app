import { useEffect, useMemo } from 'react';

import { useIotConnection } from '../../../utils/IotConnection';
import type { SubsystemKey } from './SystemStatusCard';
import type { SubsystemStatus } from './StatusTile';
import type { ArmMode } from './useMainControls';
import type { ZoneCondition } from './ZoneStatusCard';

const log = (...args: any[]) => console.log('[Main]', ...args);

/** Shape of `sba_control_v01`'s reported shadow document — only the fields this screen reads. */
export interface MainReportedStatus {
  /** 0 = Stay, 1 = Away — mirrors the `arm` field this screen publishes. */
  status?: number;
  /** Per-zone health, 9 entries (zones 1-8 then tamper): 0 normal, 1 warning, 2 alarm. */
  zon?: number[];
  /**
   * Per-zone location name, 9 entries (zones 1-8 then tamper). The device
   * pads these with leading spaces and sends the literal text "Empty" for a
   * zone nobody has set up yet — both handled in `normalizeZoneLocation`.
   */
  zloc?: string[];
  /** Per-zone mode, 9 entries (zones 1-8 then tamper): 0 Night, 1 Always. */
  zmd?: number[];
  ac_fail?: number;
  hooter_fail?: number;
  bat_fail?: number;
  /** 0 = no signal, 2 = full signal; anything else is in between. */
  signal?: number;
  /** ISO timestamp of this report. */
  ts?: string;
}

/** Zones 1-8 plus the dedicated tamper line, in `zon`/`zloc`/`zmd` order. */
const ZONE_LINE_COUNT = 9;
const TAMPER_INDEX = 8;

export type ZoneMode = 'night' | 'always';

/** One `zon`/`zloc`/`zmd` line — zones 1-8 (`number` set) or the tamper line (`isTamper`). */
export interface MainZoneEntry {
  /** 1-based zone number; undefined for the tamper entry. */
  number?: number;
  isTamper: boolean;
  /** Trimmed device text; empty string if the device sent nothing at all. */
  location: string;
  /** False when the device reports this line as "Empty" — no zone set up here yet. */
  configured: boolean;
  status: ZoneCondition;
  /** Undefined only if `zmd` didn't include this index. */
  mode?: ZoneMode;
}

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

/** 0 -> normal, 1 -> warning (entry/exit delay), 2 -> fault (alarm). */
function zoneCondition(value?: number): ZoneCondition {
  if (value === 2) return 'fault';
  if (value === 1) return 'warning';
  return 'normal';
}

/** 0 -> night, 1 -> always; undefined when `zmd` has no entry at this index. */
function zoneMode(value?: number): ZoneMode | undefined {
  return value == null ? undefined : value === 1 ? 'always' : 'night';
}

/**
 * Trims the device's padded text (`"   Empty"`, `"  Panel Tamper"`) and
 * flags the literal placeholder `"Empty"` as "not configured" rather than a
 * real location name — the panel sends that for any zone nobody has wired
 * up in Part Setting yet.
 */
function normalizeZoneLocation(raw?: string): { location: string; configured: boolean } {
  const location = (raw ?? '').trim();
  const configured = location.length > 0 && location.toLowerCase() !== 'empty';
  return { location, configured };
}

/**
 * Live status for the Main screen and Zone Details, derived from
 * `sba_control_v01`'s reported shadow — read off the app's one shared MQTT
 * connection (`IotConnectionProvider`, mounted at the navigation root)
 * rather than opening a subscription of its own.
 */
export function useMainStatus() {
  const { controlReported, connected, status } = useIotConnection();
  const reported = controlReported as MainReportedStatus | null;

  useEffect(() => {
    log('CONNECTION STATUS →', status, connected ? '(connected)' : '(not connected)');
  }, [status, connected]);

  const result = useMemo(() => {
    const armMode: ArmMode | null =
      reported?.status == null ? null : reported.status === 1 ? 'away' : 'stay';

    const statuses: Partial<Record<SubsystemKey, SubsystemStatus>> = {
      zone: zoneAggregateStatus(reported?.zon),
      battery: binaryStatus(reported?.bat_fail),
      // the device's `ac_fail` flag — the AC tile, not `bat_fail` again.
      ac: binaryStatus(reported?.ac_fail),
      hooter: binaryStatus(reported?.hooter_fail),
      tamper: tamperStatus(reported?.zon),
      signal: signalStatus(reported?.signal),
    };

    const zones: MainZoneEntry[] = Array.from(
      { length: ZONE_LINE_COUNT },
      (_, index) => {
        const { location, configured } = normalizeZoneLocation(reported?.zloc?.[index]);
        return {
          number: index === TAMPER_INDEX ? undefined : index + 1,
          isTamper: index === TAMPER_INDEX,
          location,
          configured,
          status: zoneCondition(reported?.zon?.[index]),
          mode: zoneMode(reported?.zmd?.[index]),
        };
      },
    );

    return { connected, armMode, timestamp: reported?.ts, statuses, zones };
  }, [reported, connected]);

  useEffect(() => {
    if (!reported) return;
    log('REPORTED →', reported);
    log('DERIVED STATUS → arm:', result.armMode, 'ts:', result.timestamp);
    log('DERIVED TILES →', result.statuses);
  }, [reported, result.armMode, result.timestamp, result.statuses]);

  return result;
}
