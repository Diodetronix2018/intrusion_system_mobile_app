import { useCallback, useMemo, useState } from 'react';

/**
 * A fixed-length list of on/off lines.
 *
 * Held in memory for now; swap the body for the panel API when it lands —
 * the screens only call `toggle` and `setAll`.
 */
export function useToggleList(count: number, initial?: boolean[]) {
  const [values, setValues] = useState<boolean[]>(
    () => initial ?? Array.from({ length: count }, () => false),
  );

  const toggle = useCallback((index: number, enabled: boolean) => {
    setValues(prev =>
      prev.map((value, position) => (position === index ? enabled : value)),
    );
  }, []);

  const setAll = useCallback(
    (enabled: boolean) => setValues(prev => prev.map(() => enabled)),
    [],
  );

  const allEnabled = useMemo(
    () => values.length > 0 && values.every(Boolean),
    [values],
  );

  return { values, toggle, setAll, allEnabled };
}
