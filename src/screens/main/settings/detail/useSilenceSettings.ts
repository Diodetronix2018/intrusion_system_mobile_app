import { useCallback } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { usePrepopulatedState } from '../../../../utils/usePrepopulatedState';
import { useConfigStatus } from '../../useConfigStatus';

export const SILENCE_TIMER_MIN = 0;
export const SILENCE_TIMER_MAX = 255;

/** Each silence section is either Auto or Manual — never both, never neither. */
export type SilenceMode = 'auto' | 'manual';

export type SilenceSection = 'fault' | 'alarm';

export type SilenceSettings = {
  faultMode: SilenceMode;
  /** Minutes before fault silence ends (field name predates the unit switching from sec to min). */
  faultTimerSeconds: number;
  alarmMode: SilenceMode;
  /** Minutes before the alarm terminates (field name predates the unit switching from sec to min). */
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
 *
 * The timer only means anything in Auto mode, so a section in Manual mode
 * always sends `0` for its timer, regardless of the value last dialed in.
 */
export function buildSlnValue(settings: SilenceSettings): string {
  return [
    settings.faultMode === 'manual' ? 1 : 0,
    settings.faultMode === 'manual' ? 0 : settings.faultTimerSeconds,
    settings.alarmMode === 'manual' ? 1 : 0,
    settings.alarmMode === 'manual' ? 0 : settings.alarmTimerSeconds,
  ].join(',');
}

/** Parses the device's saved `sln` value back into `SilenceSettings`. */
export function parseSlnValue(raw: string): SilenceSettings | undefined {
  const parts = raw.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return undefined;
  const [faultMode, faultTimer, alarmMode, alarmTimer] = parts;
  return {
    faultMode: faultMode === 1 ? 'manual' : 'auto',
    faultTimerSeconds: faultTimer,
    alarmMode: alarmMode === 1 ? 'manual' : 'auto',
    alarmTimerSeconds: alarmTimer,
  };
}

/**
 * Silence state, published to the device's `sba_config_v01` shadow as
 * `{"state":{"desired":{"sln":"<...>"}}}` on save.
 *
 * Fault and Alarm each carry a single Auto/Manual mode (the device only has
 * one bit per section) plus their own timer, so `setMode` always leaves
 * exactly one of Auto/Manual selected for that section.
 *
 * Prepopulated from the device's already-saved value the first time it
 * arrives, so reopening the app shows what was last saved.
 */
export function useSilenceSettings(initial?: Partial<SilenceSettings>) {
  const { reported } = useConfigStatus();
  const [settings, setSettings] = usePrepopulatedState<string, SilenceSettings>(
    reported?.sln,
    parseSlnValue,
    { ...DEFAULTS, ...initial },
  );
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const setMode = useCallback(
    (section: SilenceSection, mode: SilenceMode) =>
      setSettings(prev => ({
        ...prev,
        [section === 'fault' ? 'faultMode' : 'alarmMode']: mode,
      })),
    [setSettings],
  );

  const setTimer = useCallback(
    (section: SilenceSection, timerSeconds: number) =>
      setSettings(prev => ({
        ...prev,
        [section === 'fault' ? 'faultTimerSeconds' : 'alarmTimerSeconds']: timerSeconds,
      })),
    [setSettings],
  );

  const save = useCallback(
    () => publish({ sln: buildSlnValue(settings) }),
    [publish, settings],
  );

  return { settings, setMode, setTimer, save, saving: publishing };
}
