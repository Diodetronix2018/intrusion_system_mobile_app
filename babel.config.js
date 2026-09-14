module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Reanimated 4 runs on react-native-worklets; this plugin must stay last.
    'react-native-worklets/plugin',
  ],
};
