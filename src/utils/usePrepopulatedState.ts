import { useEffect, useRef, useState } from 'react';

/** Plain-data equality — every `T` this hook is used with is a JSON-shaped
 *  object/array of strings/numbers/booleans, built fresh by the same `parse`
 *  function each time, so key order (and therefore this) is stable. */
function isEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Like `useState`, but seeds itself from `raw` (e.g. the device's saved
 * config arriving over the global config subscription) — the first time a
 * parsed value becomes available, and again on every later change, *as
 * long as the local value hasn't diverged from the last thing this hook
 * synced in*. That covers three cases:
 *  - Nothing has loaded yet: seeds as soon as `raw` parses.
 *  - The user is mid-edit (local state no longer matches what was last
 *    synced in): a live update is ignored rather than clobbering it, and
 *    the device echoing back exactly what was just saved doesn't reset the
 *    form either — it's recognised as already matching, not as a fresh
 *    external change.
 *  - The screen is just sitting there unedited and someone changes the
 *    setting directly on the panel: the new value flows straight through,
 *    since there was nothing local to protect.
 *
 * `parse` is read through a ref, so it can freely close over `t()` or other
 * per-render values without retriggering the sync effect — only a change to
 * `raw` itself does that.
 */
export function usePrepopulatedState<Raw, T>(
  raw: Raw | undefined,
  parse: (raw: Raw) => T | undefined,
  defaults: T,
) {
  const [state, setState] = useState<T>(defaults);
  const stateRef = useRef(state);
  stateRef.current = state;

  const parseRef = useRef(parse);
  parseRef.current = parse;

  // The parsed value this hook last accepted from `raw` — the baseline a
  // live update is compared against to tell "untouched since then" from
  // "mid-edit". `undefined` means it has never synced at all yet.
  const lastSyncedRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (raw === undefined) return;
    const parsed = parseRef.current(raw);
    if (parsed === undefined) return;

    const current = stateRef.current;
    if (isEqual(current, parsed)) {
      // Already matches — either the very first load happened to match the
      // defaults, or this is the device echoing back exactly what the user
      // just saved. Either way, it's the new "last known good" baseline, so
      // a later *actual* external change can still be told apart from it.
      lastSyncedRef.current = parsed;
      return;
    }

    const synced = lastSyncedRef.current;
    const isDirty = synced !== undefined && !isEqual(current, synced);
    if (isDirty) return;

    lastSyncedRef.current = parsed;
    setState(parsed);
  }, [raw]);

  return [state, setState] as const;
}
