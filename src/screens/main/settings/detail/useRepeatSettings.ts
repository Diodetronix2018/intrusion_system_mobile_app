import { useCallback, useState } from 'react';

/** How many times an action is repeated. */
export type RepeatCount = 1 | 2 | 3;

export type RepeatKey = 'call' | 'voice' | 'admin';

export const REPEAT_COUNTS: RepeatCount[] = [1, 2, 3];

export type RepeatSettings = Record<RepeatKey, RepeatCount>;

const DEFAULTS: RepeatSettings = { call: 1, voice: 1, admin: 1 };

/**
 * Repeat counts for the three lines.
 *
 * Held in memory for now; swap the body for the panel API when it lands —
 * the screen only calls `set`.
 */
export function useRepeatSettings(initial?: Partial<RepeatSettings>) {
  const [settings, setSettings] = useState<RepeatSettings>({
    ...DEFAULTS,
    ...initial,
  });

  const set = useCallback((key: RepeatKey, count: RepeatCount) => {
    setSettings(prev => ({ ...prev, [key]: count }));
  }, []);

  return { settings, set };
}
