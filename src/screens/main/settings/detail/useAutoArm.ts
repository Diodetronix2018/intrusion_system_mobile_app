import { useCallback, useState } from 'react';

import type { Time } from '../../../../components';
import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';

const DEFAULT_TIME: Time = { hour: 22, minute: 30 };

/**
 * Builds the device's `aar` shadow value: `"<enabled 0|1>,<hour>,<minute>"`,
 * e.g. `"1,22,30"`. The time is sent even while disabled (e.g. `"0,22,30"`)
 * so the schedule survives a toggle-off without being lost.
 */
export function buildAarValue(enabled: boolean, time: Time): string {
  return [enabled ? 1 : 0, time.hour, time.minute].join(',');
}

/**
 * Scheduled auto-arm time, off by default. `save` publishes it to the
 * device's `sba_config_v01` shadow as `{"state":{"desired":{"aar":"<...>"}}}`.
 */
export function useAutoArm(
  initialTime: Time = DEFAULT_TIME,
  initialEnabled = false,
) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [time, setTime] = useState<Time>(initialTime);
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const reset = useCallback(() => setTime(DEFAULT_TIME), []);

  const save = useCallback(
    () => publish({ aar: buildAarValue(enabled, time) }),
    [publish, enabled, time],
  );

  return { enabled, setEnabled, time, setTime, reset, save, saving: publishing };
}
