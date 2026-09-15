import { useCallback, useMemo, useState } from 'react';

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
};

export const DELAY_MIN = 0;
export const DELAY_MAX = 255;

/**
 * Entry-point name per zone, in order. Fixed by the panel wiring rather than
 * chosen by the user, so these are translation keys, not state.
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

const DEFAULT_CONFIG: ZoneConfig = {
  state: 'on',
  schedule: 'always',
  contact: 'nc',
  exitDelay: 30,
  entryDelay: 30,
};

const wrap = (value: number, size: number) => ((value % size) + size) % size;

/**
 * Per-zone configuration, plus which zone is on screen.
 *
 * Every zone carries its own copy of the three settings. Held in memory for
 * now; swap the body for the panel API when it lands.
 */
export function useZoneConfig(initial?: ZoneConfig[]) {
  const [zones, setZones] = useState<ZoneConfig[]>(
    () => initial ?? Array.from({ length: ZONE_COUNT }, () => DEFAULT_CONFIG),
  );
  const [index, setIndex] = useState(0);

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

  return useMemo(
    () => ({ zones, index, config, previous, next, goTo, update }),
    [zones, index, config, previous, next, goTo, update],
  );
}
