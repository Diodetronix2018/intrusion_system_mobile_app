import { useCallback, useState } from 'react';

/** Which group of users gets the notification. */
export type UserGroup = 'admin' | 'upTo3' | 'upTo5' | 'all';

export const USER_GROUPS: UserGroup[] = ['admin', 'upTo3', 'upTo5', 'all'];

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
 * Special-notify state.
 *
 * Held in memory for now; swap the body for the panel API when it lands —
 * the screen only calls `setAlert` and `setUserGroup`.
 */
export function useSpecialNotify(initial?: Partial<SpecialNotifySettings>) {
  const [settings, setSettings] = useState<SpecialNotifySettings>({
    ...DEFAULTS,
    ...initial,
  });

  const setAlert = useCallback(
    (key: 'acFail' | 'batteryFail', enabled: boolean) =>
      setSettings(prev => ({ ...prev, [key]: enabled })),
    [],
  );

  const setUserGroup = useCallback(
    (userGroup: UserGroup) => setSettings(prev => ({ ...prev, userGroup })),
    [],
  );

  return { settings, setAlert, setUserGroup };
}
