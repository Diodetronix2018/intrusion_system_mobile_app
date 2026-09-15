/* eslint-env jest */

// Both libraries ship Jest doubles for their native side.
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// react-native-mmkv reaches for Nitro's native module as soon as it is
// imported, which does not exist under Jest. An in-memory double is all the
// session tests need.
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      set: (key, value) => store.set(key, value),
      getString: key => store.get(key),
      remove: key => store.delete(key),
      clearAll: () => store.clear(),
    }),
  };
});

// vision-camera reaches for its native module on import too. The claim screen
// only needs the hooks to report "no camera here", which is a real state it
// already renders (the manual-entry path).
jest.mock('react-native-vision-camera', () => ({
  Camera: () => null,
  useCameraDevice: () => undefined,
  useCameraPermission: () => ({
    hasPermission: false,
    requestPermission: jest.fn(),
  }),
  useCodeScanner: (config) => config,
}));
