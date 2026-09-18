import { useCallback, useState } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { normalizeIndianMobile } from '../../../../utils/validation';

export type RecordPlayAction = 'record' | 'play';

/** Builds the device's `rec`/`vmt` shadow value: `"1,<10-digit phone>"`. */
export function buildRecordPlayValue(phone: string): string {
  return `1,${normalizeIndianMobile(phone)}`;
}

/**
 * Record / Play voice-message commands, each addressed to its own shadow
 * field — `rec` to record a message from the given number, `vmt` to play
 * the stored message back to it. Both are one-shot commands, not persisted
 * settings, so there's no "Save" step: tapping a button publishes
 * immediately, the same way the Main screen's Mute/Reset do.
 *
 * The user can only send one at a time: `pendingAction` tracks which
 * button is currently publishing, and the screen disables both while
 * `saving` is true so a second tap can't overlap the first.
 *
 * Published to the device's `sba_config_v01` shadow as
 * `{"state":{"desired":{"rec"|"vmt":"<...>"}}}`.
 */
export function useRecordPlay() {
  const [pendingAction, setPendingAction] = useState<RecordPlayAction | null>(null);
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const record = useCallback(
    async (phone: string) => {
      setPendingAction('record');
      try {
        await publish({ rec: buildRecordPlayValue(phone) });
      } finally {
        setPendingAction(null);
      }
    },
    [publish],
  );

  const play = useCallback(
    async (phone: string) => {
      setPendingAction('play');
      try {
        await publish({ vmt: buildRecordPlayValue(phone) });
      } finally {
        setPendingAction(null);
      }
    },
    [publish],
  );

  return { record, play, pendingAction, saving: publishing };
}
