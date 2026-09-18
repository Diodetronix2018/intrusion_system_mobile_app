import { useCallback } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { usePrepopulatedState } from '../../../../utils/usePrepopulatedState';
import { useConfigStatus } from '../../useConfigStatus';

/** Builds the device's `hnt` shadow value: `"1"` enabled, `"2"` disabled. */
export function buildHntValue(enabled: boolean): string {
  return enabled ? '1' : '2';
}

/** Parses the device's saved `hnt` value back into the on-screen toggle. */
export function parseHntValue(raw: string): boolean | undefined {
  if (raw === '1') return true;
  if (raw === '2') return false;
  return undefined;
}

/**
 * Hooter Notify toggle, published to the device's `sba_config_v01` shadow
 * as `{"state":{"desired":{"hnt":"<...>"}}}` on save. Prepopulated from the
 * device's already-saved value (`ConfigStatusProvider`) the first time it
 * arrives, so reopening the app shows what was last saved rather than
 * always starting from the default.
 */
export function useHooterNotify(initialEnabled = true) {
  const { reported } = useConfigStatus();
  const [enabled, setEnabled] = usePrepopulatedState(
    reported?.hnt,
    parseHntValue,
    initialEnabled,
  );
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const save = useCallback(
    () => publish({ hnt: buildHntValue(enabled) }),
    [publish, enabled],
  );

  return { enabled, setEnabled, save, saving: publishing };
}
