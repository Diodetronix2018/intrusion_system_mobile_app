import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useArmMode } from './useArmMode';

/**
 * Blocks publishing a settings change while the panel is Away — every
 * settings/Dialer/Zone page's save, and the Main screen's Reset action,
 * call `requireStayMode()` first and bail out if it returns true (it has
 * already shown the toast explaining why).
 */
export function useEditGuard() {
  const { t } = useTranslation();
  const armMode = useArmMode();
  const locked = armMode === 'away';

  const requireStayMode = useCallback(() => {
    if (!locked) return false;
    Toast.show({ type: 'error', text1: t('common.stayModeRequired') });
    return true;
  }, [locked, t]);

  return { locked, requireStayMode };
}
