module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Inlines the `.env` values behind the `@env` module at build time. After
    // editing `.env`, restart Metro with `yarn start --reset-cache`.
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: false,
      },
    ],
    // Reanimated 4 runs on react-native-worklets; this plugin must stay last.
    'react-native-worklets/plugin',
  ],
};
