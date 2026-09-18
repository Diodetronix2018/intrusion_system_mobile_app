import { useCallback, useState } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';

/** Builds the device's `hnt` shadow value: `"1"` enabled, `"2"` disabled. */
export function buildHntValue(enabled: boolean): string {
  return enabled ? '1' : '2';
}

/**
 * Hooter Notify toggle, published to the device's `sba_config_v01` shadow
 * as `{"state":{"desired":{"hnt":"<...>"}}}` on save.
 */
export function useHooterNotify(initialEnabled = true) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const save = useCallback(
    () => publish({ hnt: buildHntValue(enabled) }),
    [publish, enabled],
  );

  return { enabled, setEnabled, save, saving: publishing };
}
