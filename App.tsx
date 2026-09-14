/**
 * Intrusion System — app root.
 *
 * @format
 */

import React from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SessionProvider } from './src/session/SessionProvider';
import { ThemeProvider } from './src/theme';

function App() {
  return (
    // `system` follows the device setting; pass 'light' or 'dark' to pin it
    <ThemeProvider initialMode="system">
      <SessionProvider>
        <SafeAreaProvider>
          <KeyboardProvider>
            <RootNavigator />
            {/* last child so toasts float above every screen */}
            <Toast />
          </KeyboardProvider>
        </SafeAreaProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
