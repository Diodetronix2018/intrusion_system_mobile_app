import { useCallback, useMemo } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { usePrepopulatedState } from '../../../../utils/usePrepopulatedState';
import { useConfigStatus } from '../../useConfigStatus';

/** Eight zones plus the tamper line. */
export const LINE_COUNT = 9;
export const TAMPER_INDEX = 8;

const DEFAULTS: boolean[] = Array.from({ length: LINE_COUNT }, () => false);

/**
 * Builds the device's `prt` shadow value: one "0"|"1" digit per line, zones
 * 1-8 first then tamper last, e.g. `"110011001"`.
 */
export function buildPrtValue(values: boolean[]): string {
  return values.map(value => (value ? '1' : '0')).join('');
}

/** Parses the device's saved `prt` value back into the per-line toggles. */
export function parsePrtValue(raw: string): boolean[] | undefined {
  if (raw.length !== LINE_COUNT || !/^[01]+$/.test(raw)) return undefined;
  return raw.split('').map(ch => ch === '1');
}

/**
 * Part-setting state (zones 1-8 + tamper). `save` publishes it to the
 * device's `sba_config_v01` shadow as `{"state":{"desired":{"prt":"<...>"}}}`
 * — the same config shadow the Special Notify screen writes `nty` to; AWS IoT
 * merges desired-state keys, so this only ever touches `prt`.
 *
 * Prepopulated from the device's already-saved value the first time it
 * arrives, so reopening the app shows what was last saved.
 */
export function usePartSetting(initial?: boolean[]) {
  const { reported } = useConfigStatus();
  const [values, setValues] = usePrepopulatedState<string, boolean[]>(
    reported?.prt,
    parsePrtValue,
    initial ?? DEFAULTS,
  );
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const toggle = useCallback(
    (index: number, enabled: boolean) =>
      setValues(prev => prev.map((value, position) => (position === index ? enabled : value))),
    [setValues],
  );

  const setAll = useCallback(
    (enabled: boolean) => setValues(prev => prev.map(() => enabled)),
    [setValues],
  );

  const allEnabled = useMemo(
    () => values.length > 0 && values.every(Boolean),
    [values],
  );

  const save = useCallback(
    () => publish({ prt: buildPrtValue(values) }),
    [publish, values],
  );

  return { values, toggle, setAll, allEnabled, save, saving: publishing };
}
