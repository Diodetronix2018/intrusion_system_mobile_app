import { useCallback, useState } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../config/awsConfig';
import { useIotShadowPublish } from '../../../utils/useIotShadowPublish';
import {
  AlertKind,
  ContactMethod,
  DialerEntry,
  DialerEntryInput,
  MAX_DIALER_ENTRIES,
} from './types';

/** Wire codes for the `dia` shadow value's 2nd field (contact method). */
const METHOD_CODE: Record<ContactMethod, number> = {
  callAndSms: 0,
  call: 1,
  sms: 2,
};

/** Wire codes for the `dia` shadow value's 3rd field (alert kind). */
const ALERT_CODE: Record<AlertKind, number> = {
  burglarAndFire: 0,
  burglar: 1,
  fire: 2,
};

/** Slot value that means "delete every dial-out number". */
const DELETE_ALL_SLOT = 99;

/**
 * Builds the device's `dia` shadow value for adding/updating a slot:
 * `"<slot 0-14>,<method 0-2>,<alert 0-2>,<10-digit phone>"`, e.g. `"1,0,0,9283696917"`.
 */
export function buildDiaValue(slot: number, values: DialerEntryInput): string {
  return [slot, METHOD_CODE[values.method], ALERT_CODE[values.alert], values.phone].join(',');
}

/**
 * Builds the device's `dia` shadow value for deleting a single slot:
 * `"<slot>,0,0,"` — method/alert hardcoded, phone left empty.
 */
export function buildDiaDeleteValue(slot: number): string {
  return `${slot},0,0,`;
}

/** The `dia` shadow value that deletes every dial-out number at once. */
export const DELETE_ALL_DIA_VALUE = buildDiaDeleteValue(DELETE_ALL_SLOT);

/** Lowest 0-14 slot not already occupied, or -1 if every slot is taken. */
function firstFreeSlot(entries: DialerEntry[]): number {
  const used = new Set(entries.map(entry => entry.slot));
  for (let slot = 0; slot < MAX_DIALER_ENTRIES; slot++) {
    if (!used.has(slot)) return slot;
  }
  return -1;
}

/**
 * Dial-out list state, published to the device's `sba_config_v01` shadow as
 * `{"state":{"desired":{"dia":"<...>"}}}`.
 *
 * Unlike the other settings screens there is no batched "Save" step: the
 * device protocol addresses one slot (or the `99` "delete all" sentinel) per
 * message, so every mutation here publishes immediately. Local state only
 * changes once the publish is acknowledged, so the list always reflects what
 * actually landed on the device rather than what the user merely tapped.
 */
export function useDialerEntries(initial: DialerEntry[] = []) {
  const [entries, setEntries] = useState<DialerEntry[]>(initial);
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const isFull = entries.length >= MAX_DIALER_ENTRIES;

  const add = useCallback(
    async (values: DialerEntryInput) => {
      const slot = firstFreeSlot(entries);
      if (slot === -1) return;
      await publish({ dia: buildDiaValue(slot, values) });
      setEntries(prev =>
        [...prev, { slot, ...values }].sort((a, b) => a.slot - b.slot),
      );
    },
    [entries, publish],
  );

  const update = useCallback(
    async (slot: number, values: DialerEntryInput) => {
      await publish({ dia: buildDiaValue(slot, values) });
      setEntries(prev =>
        prev.map(entry => (entry.slot === slot ? { slot, ...values } : entry)),
      );
    },
    [publish],
  );

  const setMethod = useCallback(
    async (slot: number, method: ContactMethod) => {
      const entry = entries.find(item => item.slot === slot);
      if (!entry) return;
      await update(slot, { ...entry, method });
    },
    [entries, update],
  );

  const setAlert = useCallback(
    async (slot: number, alert: AlertKind) => {
      const entry = entries.find(item => item.slot === slot);
      if (!entry) return;
      await update(slot, { ...entry, alert });
    },
    [entries, update],
  );

  const remove = useCallback(
    async (slot: number) => {
      await publish({ dia: buildDiaDeleteValue(slot) });
      setEntries(prev => prev.filter(entry => entry.slot !== slot));
    },
    [publish],
  );

  const removeAll = useCallback(async () => {
    await publish({ dia: DELETE_ALL_DIA_VALUE });
    setEntries([]);
  }, [publish]);

  return {
    entries,
    isFull,
    /** True while any dial-out publish is in flight — guards against overlapping publishes. */
    saving: publishing,
    add,
    update,
    setMethod,
    setAlert,
    remove,
    removeAll,
  };
}
