import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SBA_CONFIG_SHADOW } from '../../../config/awsConfig';
import { useIotShadowPublish } from '../../../utils/useIotShadowPublish';

export const ZONE_COUNT = 8;

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
 * Per-zone configuration, plus which zone is on screen. Every zone carries
 * its own copy of the settings; `save` publishes only the zone currently on
 * screen to the device's `sba_config_v01` shadow as
 * `{"state":{"desired":{"zon":"<...>"}}}`.
 */
export function useZoneConfig(initial?: ZoneConfig[]) {
  const { t } = useTranslation();
  // Seeds each zone's (now free-text, editable) location with its localized
  // default name, e.g. "Main Door" — same starting labels as before this
  // field became editable. Lazy initializer, so this only runs once; editing
  // it (or switching app language afterwards) never overwrites what the
  // user typed.
  const [zones, setZones] = useState<ZoneConfig[]>(
    () =>
      initial ??
      ZONE_LOCATION_KEYS.map(key => ({
        ...DEFAULT_CONFIG,
        location: t(`zone.locations.${key}`),
      })),
  );
  const [index, setIndex] = useState(0);
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const config = zones[index];

  const goTo = useCallback(
    (next: number) => setIndex(wrap(next, ZONE_COUNT)),
    [],
  );

  const previous = useCallback(() => setIndex(i => wrap(i - 1, ZONE_COUNT)), []);
  const next = useCallback(() => setIndex(i => wrap(i + 1, ZONE_COUNT)), []);

  const update = useCallback(
    (patch: Partial<ZoneConfig>) =>
      setZones(prev =>
        prev.map((zone, position) =>
          position === index ? { ...zone, ...patch } : zone,
        ),
      ),
    [index],
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
