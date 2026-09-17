import { useCallback, useState } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';

export const SILENCE_TIMER_MIN = 0;
export const SILENCE_TIMER_MAX = 255;

/** Each silence section is either Auto or Manual — never both, never neither. */
export type SilenceMode = 'auto' | 'manual';

export type SilenceSection = 'fault' | 'alarm';

export type SilenceSettings = {
  faultMode: SilenceMode;
  /** Seconds before fault silence ends. */
  faultTimerSeconds: number;
  alarmMode: SilenceMode;
  /** Seconds before the alarm terminates. */
  alarmTimerSeconds: number;
};

const DEFAULTS: SilenceSettings = {
  faultMode: 'auto',
  faultTimerSeconds: 30,
  alarmMode: 'auto',
  alarmTimerSeconds: 30,
};

/**
 * Builds the device's `sln` shadow value:
 * `"<faultMode 0|1>,<faultTimer>,<alarmMode 0|1>,<alarmTimer>"`, e.g. `"0,5,0,3"`.
 */
export function buildSlnValue(settings: SilenceSettings): string {
  return [
    settings.faultMode === 'manual' ? 1 : 0,
    settings.faultTimerSeconds,
    settings.alarmMode === 'manual' ? 1 : 0,
    settings.alarmTimerSeconds,
  ].join(',');
}

/**
 * Silence state, published to the device's `sba_config_v01` shadow as
 * `{"state":{"desired":{"sln":"<...>"}}}` on save.
 *
 * Fault and Alarm each carry a single Auto/Manual mode (the device only has
 * one bit per section) plus their own timer, so `setMode` always leaves
 * exactly one of Auto/Manual selected for that section.
 */
export function useSilenceSettings(initial?: Partial<SilenceSettings>) {
  const [settings, setSettings] = useState<SilenceSettings>({
    ...DEFAULTS,
    ...initial,
  });
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const setMode = useCallback(
    (section: SilenceSection, mode: SilenceMode) =>
      setSettings(prev => ({
        ...prev,
        [section === 'fault' ? 'faultMode' : 'alarmMode']: mode,
      })),
    [],
  );

  const setTimer = useCallback(
    (section: SilenceSection, timerSeconds: number) =>
      setSettings(prev => ({
        ...prev,
        [section === 'fault' ? 'faultTimerSeconds' : 'alarmTimerSeconds']: timerSeconds,
      })),
    [],
  );

  const save = useCallback(
    () => publish({ sln: buildSlnValue(settings) }),
    [publish, settings],
  );

  return { settings, setMode, setTimer, save, saving: publishing };
}
