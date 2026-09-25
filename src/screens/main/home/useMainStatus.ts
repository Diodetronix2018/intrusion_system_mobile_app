import { useEffect, useMemo } from 'react';

import { useIotConnection } from '../../../utils/IotConnection';
import { useArmMode } from '../useArmMode';
import type { SubsystemKey } from './SystemStatusCard';
import type { SubsystemStatus } from './StatusTile';
import type { PartitionMode } from './useMainControls';
import type { ZoneCondition } from './ZoneStatusCard';

const log = (...args: any[]) => console.log('[Main]', ...args);

/** Shape of `sba_control_v01`'s reported shadow document — only the fields this screen reads. */
export interface MainReportedStatus {
  /** 0 = Stay, 1 = Away — mirrors the `arm` field this screen publishes. */
  status?: number;
  /**
   * Per-zone partition inclusion, 9 entries (zones 1-8 then tamper): 1 = in
   * the All partition, 0 = excluded (Part). Mirrors the `mod` field this
   * screen publishes, but reported back per-zone rather than as one code.
   */
  zen?: number[];
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
  /**
   * The raw `zon[index]` code this entry's `status` was derived from — only
   * meaningful for an actual zone (`isTamper: false`); feeds the specific
   * per-code label (Delay/Bypass/Alarm/…) on the Zone Details page.
   */
  rawValue?: number;
  /** Undefined only if `zmd` didn't include this index. */
  mode?: ZoneMode;
}

/**
 * A zone's `zon[index]` code, split into the same three tiers every other
 * subsystem uses: 0 -> normal; 1 (Delay), 3 (Bypass), 4 (Warning) or 6
 * (Isolate) -> warning; 2 (Alarm) or 7 (Fire) -> fault. Anything else
 * (undefined, or a code the panel hasn't defined) falls back to normal.
 */
const ZONE_WARNING_VALUES = new Set([1, 3, 4, 6]);
const ZONE_FAULT_VALUES = new Set([2, 7]);

/**
 * All-normal -> success; any warning-tier code (no fault-tier) -> warning;
 * any fault-tier code -> failed — zones 1-8 only (`zon[0..TAMPER_INDEX-1]`).
 * The tamper line at `zon[TAMPER_INDEX]` has its own tile (`tamperStatus`)
 * and must never affect this one, or the other way around.
 */
function zoneAggregateStatus(zon?: number[]): SubsystemStatus {
  const zones = zon?.slice(0, TAMPER_INDEX);
  if (!zones || zones.length === 0) return 'success';
  if (zones.some(value => ZONE_FAULT_VALUES.has(value))) return 'failed';
  if (zones.some(value => ZONE_WARNING_VALUES.has(value))) return 'warning';
  return 'success';
}

/** 0 -> success, anything else -> failed (no warning tier for these subsystems). */
function binaryStatus(failFlag?: number): SubsystemStatus {
  return failFlag ? 'failed' : 'success';
}

function tamperStatus(zon?: number[]): SubsystemStatus {
  return binaryStatus(zon?.[TAMPER_INDEX]);
}

/** All 9 zones included (all 1s) -> All; any zone excluded (any 0) -> Part. */
function partitionModeFromZen(zen?: number[]): PartitionMode | null {
  if (!zen || zen.length === 0) return null;
  return zen.every(value => value === 1) ? 'all' : 'part';
}

function signalStatus(signal?: number): SubsystemStatus {
  if (signal === 0) return 'failed';
  if (signal === 2) return 'success';
  return 'warning';
}

/** A zone's code, bucketed into the three tiers its status pill colours by. */
function zoneCondition(value?: number): ZoneCondition {
  if (value != null && ZONE_FAULT_VALUES.has(value)) return 'fault';
  if (value != null && ZONE_WARNING_VALUES.has(value)) return 'warning';
  return 'normal';
}

/**
 * The tamper line is a plain binary flag (0/1), not one of the zones' eight
 * codes — mirrors `tamperStatus`'s two-tier treatment (no "warning" tier)
 * rather than running it through `zoneCondition`.
 */
function tamperCondition(value?: number): ZoneCondition {
  return value ? 'fault' : 'normal';
}

/**
 * The zone code's own specific label — translated under
 * `main.zoneStatus.codes.<key>` — for the Zone Details page's per-zone
 * status pill, which (unlike the aggregate tile) always has one exact code
 * to name rather than a tier to summarise.
 */
const ZONE_CODE_LABEL_KEYS: Record<number, string> = {
  0: 'normal',
  1: 'delay',
  2: 'alarm',
  3: 'bypass',
  4: 'warning',
  6: 'isolate',
  7: 'fire',
};

export function zoneCodeLabelKey(value?: number): string {
  return (value != null && ZONE_CODE_LABEL_KEYS[value]) || 'normal';
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
function normalizeZoneLocation(raw?: string): {
  location: string;
  configured: boolean;
} {
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
  const armMode = useArmMode();

  useEffect(() => {
    log(
      'CONNECTION STATUS →',
      status,
      connected ? '(connected)' : '(not connected)',
    );
  }, [status, connected]);

  const result = useMemo(() => {
    const partitionMode: PartitionMode | null = partitionModeFromZen(
      reported?.zen,
    );

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
        const { location, configured } = normalizeZoneLocation(
          reported?.zloc?.[index],
        );
        const rawValue = reported?.zon?.[index];
        const isTamper = index === TAMPER_INDEX;
        return {
          number: isTamper ? undefined : index + 1,
          isTamper,
          location,
          configured,
          status: isTamper
            ? tamperCondition(rawValue)
            : zoneCondition(rawValue),
          rawValue: isTamper ? undefined : rawValue,
          mode: zoneMode(reported?.zmd?.[index]),
        };
      },
    );

    return {
      connected,
      armMode,
      partitionMode,
      timestamp: reported?.ts,
      statuses,
      zones,
    };
  }, [reported, connected, armMode]);

  useEffect(() => {
    if (!reported) return;
    log('REPORTED →', reported);
    log(
      'DERIVED STATUS → arm:',
      result.armMode,
      'partition:',
      result.partitionMode,
      'ts:',
      result.timestamp,
    );
    log('DERIVED TILES →', result.statuses);
  }, [
    reported,
    result.armMode,
    result.partitionMode,
    result.timestamp,
    result.statuses,
  ]);

  return result;
}
