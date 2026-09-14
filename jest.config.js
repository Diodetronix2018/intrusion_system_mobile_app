module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // vector-icon font files are binary; Jest only needs a placeholder
    '\\.(ttf|otf|woff|woff2|eot)$': '<rootDir>/__mocks__/fileMock.js',
    // react-native-svg-transformer is Metro-only, so mock SVG imports here
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|@react-native-vector-icons|react-native-svg|react-native-keyboard-controller|react-native-reanimated|react-native-worklets)/)',
  ],
};
