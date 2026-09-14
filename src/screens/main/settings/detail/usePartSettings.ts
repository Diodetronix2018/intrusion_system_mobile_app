import { useCallback, useState } from 'react';

/** Eight zones plus the tamper line. */
export const PART_SETTING_COUNT = 9;
export const TAMPER_INDEX = 8;

export type PartSetting = {
  /** 0-7 are Zone 1-8; 8 is Tamper */
  index: number;
  enabled: boolean;
};

const initialState = (): PartSetting[] =>
  Array.from({ length: PART_SETTING_COUNT }, (_, index) => ({
    index,
    enabled: false,
  }));

/**
 * Partition state for the nine lines.
 *
 * Held in memory for now; swap the body for the panel API when it lands —
 * the screen only calls `toggle`.
 */
export function usePartSettings(initial?: PartSetting[]) {
  const [settings, setSettings] = useState<PartSetting[]>(
    initial ?? initialState,
  );

  const toggle = useCallback((index: number, enabled: boolean) => {
    setSettings(prev =>
      prev.map(item => (item.index === index ? { ...item, enabled } : item)),
    );
  }, []);

  return { settings, toggle };
}
