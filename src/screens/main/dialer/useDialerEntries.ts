import { useCallback, useState } from 'react';

import {
  AlertKind,
  ContactMethod,
  DialerEntry,
  DialerEntryInput,
  MAX_DIALER_ENTRIES,
} from './types';

let nextId = 0;
const createId = () => `dialer-${++nextId}`;

/**
 * Dial-out list state.
 *
 * Held in memory for now; swap the body for the panel API when it lands —
 * the screen only calls these five actions.
 */
export function useDialerEntries(initial: DialerEntry[] = []) {
  const [entries, setEntries] = useState<DialerEntry[]>(initial);

  const isFull = entries.length >= MAX_DIALER_ENTRIES;

  const add = useCallback((values: DialerEntryInput) => {
    setEntries(prev =>
      prev.length >= MAX_DIALER_ENTRIES
        ? prev
        : [...prev, { id: createId(), ...values }],
    );
  }, []);

  const update = useCallback((id: string, values: DialerEntryInput) => {
    setEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, ...values } : entry)),
    );
  }, []);

  const setMethod = useCallback((id: string, method: ContactMethod) => {
    setEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, method } : entry)),
    );
  }, []);

  const setAlert = useCallback((id: string, alert: AlertKind) => {
    setEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, alert } : entry)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const removeAll = useCallback(() => setEntries([]), []);

  return {
    entries,
    isFull,
    add,
    update,
    setMethod,
    setAlert,
    remove,
    removeAll,
  };
}
