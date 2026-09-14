/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n, { LANGUAGES, LanguageCode } from '../src/i18n';
import { BottomTabs } from '../src/navigation/BottomTabs';
import { SettingsScreen, SignInScreen, SignUpScreen } from '../src/screens';
import { ThemeMode, ThemeProvider } from '../src/theme';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * Mounts, then unmounts again — a tree left mounted would re-render on the
 * next language change and warn about updates outside act().
 */
async function render(node: React.ReactElement, mode: ThemeMode = 'light') {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <ThemeProvider initialMode={mode}>
        <SafeAreaProvider initialMetrics={METRICS}>{node}</SafeAreaProvider>
      </ThemeProvider>,
    );
  });
  expect(tree!.toJSON()).toBeTruthy();
  await ReactTestRenderer.act(() => {
    tree!.unmount();
  });
}

describe.each<ThemeMode>(['light', 'dark'])('in %s theme', mode => {
  test('sign in renders', () => render(<SignInScreen />, mode));
  test('sign up renders', () => render(<SignUpScreen />, mode));
  test('bottom tabs render', () => render(<BottomTabs />, mode));
  test('settings render', () => render(<SettingsScreen />, mode));
});

const TRANSLATED_KEYS = [
  'brand.name',
  'brand.tagline',
  'auth.signIn.submit',
  'auth.signIn.forgotPassword',
  'auth.signIn.footerPrompt',
  'auth.signIn.footerAction',
  'auth.signUp.submit',
  'auth.signUp.footerPrompt',
  'auth.signUp.footerAction',
  'auth.fields.identifier.label',
  'auth.fields.identifier.placeholder',
  'auth.fields.fullName.label',
  'auth.fields.email.label',
  'auth.fields.password.label',
  'auth.fields.newPassword.placeholder',
  'auth.fields.confirmPassword.placeholder',
  'validation.invalidEmail',
  'validation.passwordMismatch',
  'tabs.main',
  'tabs.zone',
  'tabs.dialer',
  'tabs.events',
  'tabs.settings',
  'settings.language',
  'settings.theme',
];

describe.each(LANGUAGES.map(language => language.code))('in %s', code => {
  beforeAll(() => i18n.changeLanguage(code as LanguageCode));
  afterAll(() => i18n.changeLanguage('en'));

  test('every key used by the UI is translated', () => {
    for (const key of TRANSLATED_KEYS) {
      // i18next echoes the key back when a translation is missing
      expect(i18n.t(key)).not.toBe(key);
    }
  });

  test('sign in renders', () => render(<SignInScreen />));
  test('sign up renders', () => render(<SignUpScreen />));
  test('bottom tabs render', () => render(<BottomTabs />));
});
