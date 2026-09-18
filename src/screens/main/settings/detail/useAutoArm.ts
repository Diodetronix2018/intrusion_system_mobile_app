import { useCallback } from 'react';

import type { Time } from '../../../../components';
import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { usePrepopulatedState } from '../../../../utils/usePrepopulatedState';
import { useConfigStatus } from '../../useConfigStatus';

const DEFAULT_TIME: Time = { hour: 22, minute: 30 };

interface AutoArmState {
  enabled: boolean;
  time: Time;
}

/**
 * Builds the device's `aar` shadow value: `"<enabled 0|1>,<hour>,<minute>"`,
 * e.g. `"1,22,30"`. The time is sent even while disabled (e.g. `"0,22,30"`)
 * so the schedule survives a toggle-off without being lost.
 */
export function buildAarValue(enabled: boolean, time: Time): string {
  return [enabled ? 1 : 0, time.hour, time.minute].join(',');
}

/** Parses the device's saved `aar` value back into enabled + time. */
export function parseAarValue(raw: string): AutoArmState | undefined {
  const parts = raw.split(',');
  if (parts.length !== 3) return undefined;
  const [enabledRaw, hourRaw, minuteRaw] = parts;
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return undefined;
  return { enabled: enabledRaw === '1', time: { hour, minute } };
}

/**
 * Scheduled auto-arm time, off by default. `save` publishes it to the
 * device's `sba_config_v01` shadow as `{"state":{"desired":{"aar":"<...>"}}}`.
 * Prepopulated from the device's already-saved value the first time it
 * arrives, so reopening the app shows what was last saved.
 */
export function useAutoArm(
  initialTime: Time = DEFAULT_TIME,
  initialEnabled = false,
) {
  const { reported } = useConfigStatus();
  const [state, setState] = usePrepopulatedState<string, AutoArmState>(
    reported?.aar,
    parseAarValue,
    { enabled: initialEnabled, time: initialTime },
  );
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const setEnabled = useCallback(
    (enabled: boolean) => setState(prev => ({ ...prev, enabled })),
    [setState],
  );

  const setTime = useCallback(
    (time: Time) => setState(prev => ({ ...prev, time })),
    [setState],
  );

  const reset = useCallback(
    () => setState(prev => ({ ...prev, time: DEFAULT_TIME })),
    [setState],
  );

  const save = useCallback(
    () => publish({ aar: buildAarValue(state.enabled, state.time) }),
    [publish, state],
  );

  return {
    enabled: state.enabled,
    setEnabled,
    time: state.time,
    setTime,
    reset,
    save,
    saving: publishing,
  };
}
