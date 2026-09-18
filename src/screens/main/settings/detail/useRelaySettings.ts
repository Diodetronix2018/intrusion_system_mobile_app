import { useCallback, useMemo, useState } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';

/** Relay assignment covers the eight zones; there is no tamper line. */
export const ZONE_COUNT = 8;

/** `'all'` (every zone) or the 1-based zone number that's exclusively selected. */
export type RelaySelection = 'all' | number;

const DEFAULT_SELECTION: RelaySelection = 'all';

/**
 * Builds the device's `rly` shadow value: `"0"` for all zones, or the
 * 1-based zone number for a single zone, e.g. `"3"`.
 */
export function buildRlyValue(selection: RelaySelection): string {
  return selection === 'all' ? '0' : String(selection);
}

/**
 * Relay zone assignment: either every zone, or exactly one zone. Selecting
 * a zone deselects every other zone (and "All Zones") — there is no
 * partial-selection state, since the device only accepts a single number.
 *
 * Every zone's switch shows ON while "All Zones" is selected, so tapping
 * any one specific zone's switch is, from that switch's own point of view,
 * a "turn off" gesture — yet the intent is "select just this zone", not
 * "turn everything off". `toggleZone` disambiguates using the *previous*
 * selection: turning a switch off only falls back to "All Zones" when it
 * was the sole selected zone; from "All Zones" (or any other zone), turning
 * a zone's switch "off" instead isolates it, since that's the only gesture
 * available to move from all-on to a single selection.
 *
 * Published to the device's `sba_config_v01` shadow as
 * `{"state":{"desired":{"rly":"<...>"}}}` on save.
 */
export function useRelaySettings(initial: RelaySelection = DEFAULT_SELECTION) {
  const [selection, setSelection] = useState<RelaySelection>(initial);
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  /** Per-zone on/off, derived from `selection`, for the toggle-row UI. */
  const values = useMemo(
    () =>
      Array.from(
        { length: ZONE_COUNT },
        (_, index) => selection === 'all' || selection === index + 1,
      ),
    [selection],
  );

  const selectAll = useCallback(() => setSelection('all'), []);

  const toggleZone = useCallback((zoneNumber: number, next: boolean) => {
    setSelection(prev => {
      // Turning a zone's switch on always exclusively selects it.
      if (next) return zoneNumber;
      // Turning it off: only revert to "All Zones" if this zone was the
      // one actually selected — otherwise (e.g. tapping a zone while "All
      // Zones" is active) isolate it instead.
      return prev === zoneNumber ? 'all' : zoneNumber;
    });
  }, []);

  const save = useCallback(
    () => publish({ rly: buildRlyValue(selection) }),
    [publish, selection],
  );

  return {
    selection,
    values,
    isAllSelected: selection === 'all',
    selectAll,
    toggleZone,
    save,
    saving: publishing,
  };
}
