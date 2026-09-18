import { useCallback } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { usePrepopulatedState } from '../../../../utils/usePrepopulatedState';
import { useConfigStatus } from '../../useConfigStatus';

/** Which group of users gets the notification. */
export type UserGroup = 'admin' | 'upTo3' | 'upTo5' | 'all';

export const USER_GROUPS: UserGroup[] = ['admin', 'upTo3', 'upTo5', 'all'];

// Index each group holds in the device's `nty` shadow value (3rd field):
// 0 - admin, 1 - (1-3 users), 2 - (1-5 users), 3 - all users.
const USER_GROUP_INDEX: Record<UserGroup, number> = {
  admin: 0,
  upTo3: 1,
  upTo5: 2,
  all: 3,
};

export type SpecialNotifySettings = {
  acFail: boolean;
  batteryFail: boolean;
  userGroup: UserGroup;
};

const DEFAULTS: SpecialNotifySettings = {
  acFail: true,
  batteryFail: true,
  userGroup: 'admin',
};

/**
 * Builds the device's `nty` shadow value from the on-screen settings:
 * `"<acFail 0|1>,<batteryFail 0|1>,<userGroup 0-3>"`, e.g. `"1,1,0"`.
 */
export function buildNtyValue(settings: SpecialNotifySettings): string {
  return [
    settings.acFail ? 1 : 0,
    settings.batteryFail ? 1 : 0,
    USER_GROUP_INDEX[settings.userGroup],
  ].join(',');
}

/** Parses the device's saved `nty` value back into `SpecialNotifySettings`. */
export function parseNtyValue(raw: string): SpecialNotifySettings | undefined {
  const parts = raw.split(',').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return undefined;
  const [acFail, batteryFail, groupIndex] = parts;
  return {
    acFail: acFail === 1,
    batteryFail: batteryFail === 1,
    userGroup: USER_GROUPS[groupIndex] ?? 'admin',
  };
}

/**
 * Special-notify state. `save` publishes it to the device's
 * `sba_config_v01` shadow as `{"state":{"desired":{"nty":"<...>"}}}`.
 * Prepopulated from the device's already-saved value the first time it
 * arrives (see `usePrepopulatedState`), so reopening the app shows what
 * was last saved rather than always starting from the default.
 */
export function useSpecialNotify(initial?: Partial<SpecialNotifySettings>) {
  const { reported } = useConfigStatus();
  const [settings, setSettings] = usePrepopulatedState<string, SpecialNotifySettings>(
    reported?.nty,
    parseNtyValue,
    { ...DEFAULTS, ...initial },
  );
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const setAlert = useCallback(
    (key: 'acFail' | 'batteryFail', enabled: boolean) =>
      setSettings(prev => ({ ...prev, [key]: enabled })),
    [setSettings],
  );

  const setUserGroup = useCallback(
    (userGroup: UserGroup) => setSettings(prev => ({ ...prev, userGroup })),
    [setSettings],
  );

  const save = useCallback(
    () => publish({ nty: buildNtyValue(settings) }),
    [publish, settings],
  );

  return { settings, setAlert, setUserGroup, save, saving: publishing };
}
