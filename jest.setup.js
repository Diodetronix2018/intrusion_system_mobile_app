/* eslint-env jest */

// Both libraries ship Jest doubles for their native side.
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
