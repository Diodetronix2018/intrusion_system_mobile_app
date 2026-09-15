import { createMMKV } from 'react-native-mmkv';

/**
 * Synchronous key/value store backed by MMKV — the same storage the sibling
 * 3-phase app uses. Sync reads matter on launch: the persisted session can be
 * read before the first render, so the app never flashes the sign-in screen at
 * a user who is already signed in.
 */
export const storage = createMMKV();

export const StorageService = {
  setString: (key: string, value: string) => {
    storage.set(key, value);
  },

  getString: (key: string): string | null => storage.getString(key) ?? null,

  setNumber: (key: string, value: number) => {
    storage.set(key, value.toString());
  },

  getNumber: (key: string): number | null => {
    const value = storage.getString(key);
    return value ? Number(value) : null;
  },

  setBoolean: (key: string, value: boolean) => {
    storage.set(key, value ? 'true' : 'false');
  },

  getBoolean: (key: string): boolean | null => {
    const value = storage.getString(key);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  },

  remove: (key: string) => {
    storage.remove(key);
  },

  clear: () => {
    storage.clearAll();
  },
};
