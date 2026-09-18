import { useCallback } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { usePrepopulatedState } from '../../../../utils/usePrepopulatedState';
import { useConfigStatus } from '../../useConfigStatus';

/** How many times an action is repeated. */
export type RepeatCount = 1 | 2 | 3;

export type RepeatKey = 'call' | 'voice' | 'admin';

export const REPEAT_COUNTS: RepeatCount[] = [1, 2, 3];

export type RepeatSettings = Record<RepeatKey, RepeatCount>;

const DEFAULTS: RepeatSettings = { call: 1, voice: 1, admin: 1 };

/**
 * Builds the device's `rpt` shadow value:
 * `"<call 1-3>,<voice 1-3>,<admin 0-2>"`, e.g. `"1,1,0"`.
 *
 * Call and voice repeat send the count as-is; admin sends the count minus
 * one (1 time → 0, 2 times → 1, 3 times → 2).
 */
export function buildRptValue(settings: RepeatSettings): string {
  return [settings.call, settings.voice, settings.admin - 1].join(',');
}

const toRepeatCount = (n: number): RepeatCount =>
  (REPEAT_COUNTS as number[]).includes(n) ? (n as RepeatCount) : 1;

/** Parses the device's saved `rpt` value back into `RepeatSettings`. */
export function parseRptValue(raw: string): RepeatSettings | undefined {
  const parts = raw.split(',').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return undefined;
  const [call, voice, adminIndex] = parts;
  return {
    call: toRepeatCount(call),
    voice: toRepeatCount(voice),
    admin: toRepeatCount(adminIndex + 1),
  };
}

/**
 * Repeat counts for the three lines, published to the device's
 * `sba_config_v01` shadow as `{"state":{"desired":{"rpt":"<...>"}}}` on save.
 * Prepopulated from the device's already-saved value the first time it
 * arrives, so reopening the app shows what was last saved.
 */
export function useRepeatSettings(initial?: Partial<RepeatSettings>) {
  const { reported } = useConfigStatus();
  const [settings, setSettings] = usePrepopulatedState<string, RepeatSettings>(
    reported?.rpt,
    parseRptValue,
    { ...DEFAULTS, ...initial },
  );
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const set = useCallback(
    (key: RepeatKey, count: RepeatCount) => {
      setSettings(prev => ({ ...prev, [key]: count }));
    },
    [setSettings],
  );

  const save = useCallback(
    () => publish({ rpt: buildRptValue(settings) }),
    [publish, settings],
  );

  return { settings, set, save, saving: publishing };
}
