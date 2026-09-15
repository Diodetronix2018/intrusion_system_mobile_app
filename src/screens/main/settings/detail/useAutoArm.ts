import { useCallback, useState } from 'react';

import type { Time } from '../../../../components';

const DEFAULT_TIME: Time = { hour: 22, minute: 30 };

/**
 * Scheduled auto-arm time.
 *
 * Held in memory for now; swap the body for the panel API when it lands —
 * the screen only calls `setTime`.
 */
export function useAutoArm(initial: Time = DEFAULT_TIME) {
  const [time, setTime] = useState<Time>(initial);

  const reset = useCallback(() => setTime(DEFAULT_TIME), []);

  return { time, setTime, reset };
}
