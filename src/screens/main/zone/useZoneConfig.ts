import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SBA_CONFIG_SHADOW } from '../../../config/awsConfig';
import { useIotShadowPublish } from '../../../utils/useIotShadowPublish';
import { usePrepopulatedState } from '../../../utils/usePrepopulatedState';
import { useConfigStatus } from '../useConfigStatus';

export const ZONE_COUNT = 8;

/** The `zon` value's 9th chunk (index 8) is the tamper line, not a zone. */
export const TAMPER_INDEX = ZONE_COUNT;

/** Zones 1-8 plus the tamper line — every slot this screen's selector cycles through. */
const SLOT_COUNT = ZONE_COUNT + 1;

export type ZoneState = 'on' | 'off';
export type ZoneSchedule = 'always' | 'night';
export type ZoneContact = 'nc' | 'no';

export type ZoneConfig = {
  state: ZoneState;
  schedule: ZoneSchedule;
  contact: ZoneContact;
  /** Seconds, 0-255 */
  exitDelay: number;
  entryDelay: number;
  /** Ignores a brief trip and waits for a second one before alerting. */
  smartCheck: boolean;
  /** Seconds, 0-255 — only meaningful (and only sent as non-zero) while `smartCheck` is on. */
  waitTime: number;
  /** 1-10 — only meaningful (and only sent as non-zero) while `smartCheck` is on. */
  detectionCount: number;
  /** Free-text entry-point name, e.g. "Front Door". Sent to the device as-is. */
  location: string;
};

export const DELAY_MIN = 0;
export const DELAY_MAX = 255;

export const WAIT_TIME_MIN = 0;
export const WAIT_TIME_MAX = 255;

export const DETECTION_COUNT_MIN = 1;
export const DETECTION_COUNT_MAX = 10;

export const LOCATION_MIN_LENGTH = 1;
export const LOCATION_MAX_LENGTH = 16;

/**
 * Entry-point name per zone, in order. Only used to seed a sensible starting
 * value for the (now free-text) location field — the user can retype it.
 */
export const ZONE_LOCATION_KEYS = [
  'mainDoor',
  'backDoor',
  'window',
  'motion',
  'garage',
  'balcony',
  'kitchen',
  'bedroom',
] as const;

const DEFAULT_CONFIG: Omit<ZoneConfig, 'location'> = {
  state: 'on',
  schedule: 'always',
  contact: 'nc',
  exitDelay: 30,
  entryDelay: 30,
  smartCheck: false,
  waitTime: 30,
  detectionCount: DETECTION_COUNT_MIN,
};

const wrap = (value: number, size: number) => ((value % size) + size) % size;

const STATE_CODE: Record<ZoneState, number> = { off: 0, on: 1 };
const SCHEDULE_CODE: Record<ZoneSchedule, number> = { night: 0, always: 1 };
const CONTACT_CODE: Record<ZoneContact, number> = { nc: 0, no: 1 };

/**
 * Builds the device's `zon` shadow value for one zone:
 * `"<zone 0-7>,<on/off>,<mode>,<contact>,<exitDelay>,<entryDelay>,<smartCheck>,<waitTime>,<detectionCount>,<location>"`,
 * e.g. `"0,1,0,0,10,30,0,0,0,Front Door"`.
 *
 * Wait time and detection count are only meaningful while smart check is
 * on, so they're always sent as `0` while it's off, regardless of the
 * last value the user had dialed in.
 */
export function buildZonValue(zoneIndex: number, config: ZoneConfig): string {
  return [
    zoneIndex,
    STATE_CODE[config.state],
    SCHEDULE_CODE[config.schedule],
    CONTACT_CODE[config.contact],
    config.exitDelay,
    config.entryDelay,
    config.smartCheck ? 1 : 0,
    config.smartCheck ? config.waitTime : 0,
    config.smartCheck ? config.detectionCount : 0,
    // the value is comma-joined, so a comma in the location would corrupt
    // the fields after it
    config.location.replace(/,/g, ''),
  ].join(',');
}

/**
 * Parses one zone's chunk of the device's saved `zon` value — the same 10
 * fields `buildZonValue` writes, in the same order. Returns the location
 * exactly as trimmed (which may be the empty string, or the device's
 * "Empty" placeholder trimmed down to `""`) — the caller fills in a
 * sensible default for that case, since a pure parser has no `t()` to reach for.
 */
function parseZoneChunk(chunk: string | undefined): ZoneConfig | undefined {
  const parts = chunk?.split(',');
  if (!parts || parts.length < 10) return undefined;
  const [
    ,
    stateRaw,
    scheduleRaw,
    contactRaw,
    exitDelayRaw,
    entryDelayRaw,
    smartCheckRaw,
    waitTimeRaw,
    detectionCountRaw,
    ...locationParts
  ] = parts;
  const rawLocation = locationParts.join(',').trim();
  return {
    state: Number(stateRaw) === 1 ? 'on' : 'off',
    schedule: Number(scheduleRaw) === 1 ? 'always' : 'night',
    contact: Number(contactRaw) === 1 ? 'no' : 'nc',
    exitDelay: Number(exitDelayRaw) || 0,
    entryDelay: Number(entryDelayRaw) || 0,
    smartCheck: Number(smartCheckRaw) === 1,
    waitTime: Number(waitTimeRaw) || 0,
    detectionCount: Number(detectionCountRaw) || DETECTION_COUNT_MIN,
    // "" (including the device's "Empty" placeholder, trimmed) means "not
    // configured yet" — the caller substitutes a localized default for it.
    location: rawLocation.toLowerCase() === 'empty' ? '' : rawLocation,
  };
}

/**
 * Parses the device's saved `zon` value — zone chunks 1-8 (index 0-7) plus
 * the tamper chunk (index 8, `TAMPER_INDEX`), joined with `;`.
 */
export function parseZonValue(raw: string): ZoneConfig[] | undefined {
  const chunks = raw.split(';');
  const zones: ZoneConfig[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const zone = parseZoneChunk(chunks[i]);
    if (!zone) return undefined;
    zones.push(zone);
  }
  return zones;
}

/**
 * Per-zone configuration, plus which zone is on screen. Every zone carries
 * its own copy of the settings; `save` publishes only the zone currently on
 * screen to the device's `sba_config_v01` shadow as
 * `{"state":{"desired":{"zon":"<...>"}}}`.
 *
 * Prepopulated from the device's already-saved value the first time it
 * arrives, so reopening the app shows what was last saved rather than the
 * defaults below — a zone the device reports as "Empty" still gets its
 * localized default location name, e.g. "Main Door", the same starting
 * label as before this field became editable.
 */
export function useZoneConfig(initial?: ZoneConfig[]) {
  const { t } = useTranslation();
  const { reported } = useConfigStatus();

  const defaultLocation = useCallback(
    (i: number) =>
      i === TAMPER_INDEX
        ? t('partSetting.tamper')
        : t(`zone.locations.${ZONE_LOCATION_KEYS[i]}`),
    [t],
  );

  const parseWithLocalizedDefaults = useCallback(
    (raw: string): ZoneConfig[] | undefined => {
      const zones = parseZonValue(raw);
      return zones?.map((zone, i) => ({
        ...zone,
        location: zone.location || defaultLocation(i),
      }));
    },
    [defaultLocation],
  );

  const [zones, setZones] = usePrepopulatedState<string, ZoneConfig[]>(
    reported?.zon,
    parseWithLocalizedDefaults,
    initial ??
      Array.from({ length: SLOT_COUNT }, (_, i) => ({
        ...DEFAULT_CONFIG,
        location: defaultLocation(i),
      })),
  );
  const [index, setIndex] = useState(0);
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const config = zones[index];

  const goTo = useCallback(
    (next: number) => setIndex(wrap(next, SLOT_COUNT)),
    [],
  );

  const previous = useCallback(() => setIndex(i => wrap(i - 1, SLOT_COUNT)), []);
  const next = useCallback(() => setIndex(i => wrap(i + 1, SLOT_COUNT)), []);

  const update = useCallback(
    (patch: Partial<ZoneConfig>) =>
      setZones(prev =>
        prev.map((zone, position) =>
          position === index ? { ...zone, ...patch } : zone,
        ),
      ),
    [index, setZones],
  );

  const save = useCallback(
    () => publish({ zon: buildZonValue(index, config) }),
    [publish, index, config],
  );

  return useMemo(
    () => ({
      zones,
      index,
      config,
      previous,
      next,
      goTo,
      update,
      save,
      saving: publishing,
    }),
    [zones, index, config, previous, next, goTo, update, save, publishing],
  );
}
