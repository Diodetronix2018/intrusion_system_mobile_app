import { useCallback } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { useToggleList } from './useToggleList';

/** Eight zones plus the tamper line. */
export const LINE_COUNT = 9;
export const TAMPER_INDEX = 8;

/**
 * Builds the device's `prt` shadow value: one "0"|"1" digit per line, zones
 * 1-8 first then tamper last, e.g. `"110011001"`.
 */
export function buildPrtValue(values: boolean[]): string {
  return values.map(value => (value ? '1' : '0')).join('');
}

/**
 * Part-setting state (zones 1-8 + tamper). `save` publishes it to the
 * device's `sba_config_v01` shadow as `{"state":{"desired":{"prt":"<...>"}}}`
 * — the same config shadow the Special Notify screen writes `nty` to; AWS IoT
 * merges desired-state keys, so this only ever touches `prt`.
 */
export function usePartSetting(initial?: boolean[]) {
  const { values, toggle, setAll, allEnabled } = useToggleList(LINE_COUNT, initial);
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const save = useCallback(
    () => publish({ prt: buildPrtValue(values) }),
    [publish, values],
  );

  return { values, toggle, setAll, allEnabled, save, saving: publishing };
}
