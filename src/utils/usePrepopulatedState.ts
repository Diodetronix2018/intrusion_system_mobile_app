import { useEffect, useRef, useState } from 'react';

/**
 * Like `useState`, but seeds itself once from `raw` the first time a parsed
 * value becomes available (e.g. the device's saved config arriving over the
 * global config subscription) — after that, local edits are authoritative:
 * further changes to `raw` are ignored, so a live update can never clobber
 * what the user is mid-editing, and the device echoing back exactly what
 * was just saved doesn't reset the form either.
 *
 * `parse` is read through a ref, so it can freely close over `t()` or other
 * per-render values without retriggering the seed effect — only a change to
 * `raw` itself does that.
 */
export function usePrepopulatedState<Raw, T>(
  raw: Raw | undefined,
  parse: (raw: Raw) => T | undefined,
  defaults: T,
) {
  const [state, setState] = useState<T>(defaults);
  const seeded = useRef(false);
  const parseRef = useRef(parse);
  parseRef.current = parse;

  useEffect(() => {
    if (seeded.current || raw === undefined) return;
    const parsed = parseRef.current(raw);
    if (parsed === undefined) return;
    setState(parsed);
    seeded.current = true;
  }, [raw]);

  return [state, setState] as const;
}
