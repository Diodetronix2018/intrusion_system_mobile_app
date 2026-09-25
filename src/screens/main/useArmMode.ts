import { useMemo } from 'react';

import { useIotConnection } from '../../utils/IotConnection';
import type { ArmMode } from './home/useMainControls';

interface ArmModeReported {
  /** 0 = Stay, 1 = Away. */
  status?: number;
}

/**
 * The panel's current Stay/Away mode, read directly off `sba_control_v01`'s
 * reported `status` — the same field `useMainStatus` derives `armMode` from,
 * for screens (Settings, Dialer, Zone) that only need this one value and
 * have no reason to pull in the rest of that hook's zone/tile parsing.
 */
export function useArmMode(): ArmMode | null {
  const { controlReported } = useIotConnection();
  const status = (controlReported as ArmModeReported | null)?.status;
  return useMemo(
    () => (status == null ? null : status === 1 ? 'away' : 'stay'),
    [status],
  );
}
