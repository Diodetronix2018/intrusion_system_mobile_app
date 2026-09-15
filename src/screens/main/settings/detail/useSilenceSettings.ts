import { useCallback, useState } from 'react';

export const SILENCE_TIMER_MIN = 0;
export const SILENCE_TIMER_MAX = 255;

export type SilenceToggle =
  | 'faultManual'
  | 'faultAuto'
  | 'alarmManual'
  | 'alarmAuto';

export type SilenceSettings = Record<SilenceToggle, boolean> & {
  /** Seconds before the alarm terminates */
  timerSeconds: number;
};

const DEFAULTS: SilenceSettings = {
  faultManual: false,
  faultAuto: false,
  alarmManual: false,
  alarmAuto: false,
  timerSeconds: 30,
};

/**
 * Silence state.
 *
 * Held in memory for now; swap the body for the panel API when it lands —
 * the screen only calls `setToggle` and `setTimer`.
 */
export function useSilenceSettings(initial?: Partial<SilenceSettings>) {
  const [settings, setSettings] = useState<SilenceSettings>({
    ...DEFAULTS,
    ...initial,
  });

  const setToggle = useCallback(
    (key: SilenceToggle, enabled: boolean) =>
      setSettings(prev => ({ ...prev, [key]: enabled })),
    [],
  );

  const setTimer = useCallback(
    (timerSeconds: number) =>
      setSettings(prev => ({ ...prev, timerSeconds })),
    [],
  );

  return { settings, setToggle, setTimer };
}
