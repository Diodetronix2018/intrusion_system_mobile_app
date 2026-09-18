/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n, { LANGUAGES, LanguageCode } from '../src/i18n';
import { BottomTabs } from '../src/navigation/BottomTabs';
import {
  ForgotPasswordScreen,
  MainStatusProvider,
  SettingsScreen,
  SignInScreen,
  SignUpScreen,
} from '../src/screens';
import { SessionProvider } from '../src/session/SessionProvider';
import { ThemeMode, ThemeProvider } from '../src/theme';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** The reset screens are route-driven; only `route.params` is read on mount. */
const FORGOT_PROPS = {
  route: { params: undefined },
} as unknown as React.ComponentProps<typeof ForgotPasswordScreen>;

/**
 * Mounts, then unmounts again — a tree left mounted would re-render on the
 * next language change and warn about updates outside act().
 *
 * The screens read the session and the navigation object, so both providers
 * wrap every tree here the way the app wraps them. `MainStatusProvider`
 * matches `RootNavigator`, which mounts it once around the whole
 * signed-in app rather than inside `MainScreen` itself — anything that
 * reads `useMainStatus()` (Main, and this suite's `BottomTabs`) needs it
 * present too.
 */
async function render(node: React.ReactElement, mode: ThemeMode = 'light') {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <ThemeProvider initialMode={mode}>
        <SessionProvider>
          <MainStatusProvider>
            <SafeAreaProvider initialMetrics={METRICS}>
              <NavigationContainer>{node}</NavigationContainer>
            </SafeAreaProvider>
          </MainStatusProvider>
        </SessionProvider>
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
  test('forgot password renders', () =>
    render(<ForgotPasswordScreen {...FORGOT_PROPS} />, mode));
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
  'auth.fields.code.label',
  'auth.verify.title',
  'auth.verify.submit',
  'auth.verify.resend',
  'auth.forgot.title',
  'auth.forgot.subtitle',
  'auth.forgot.submit',
  'auth.forgot.footerAction',
  'auth.reset.title',
  'auth.reset.submit',
  'auth.errors.signInFailed',
  'auth.errors.tryAgain',
  'profile.logout',
  'profile.logoutConfirm',
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
  test('forgot password renders', () =>
    render(<ForgotPasswordScreen {...FORGOT_PROPS} />));
  test('bottom tabs render', () => render(<BottomTabs />));
});
