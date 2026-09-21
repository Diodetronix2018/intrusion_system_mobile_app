import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  ClaimDeviceScreen,
  ConfirmSignUpScreen,
  ForgotPasswordScreen,
  HelpSupportScreen,
  ProfileScreen,
  ResetPasswordScreen,
  SettingsDetailScreen,
  SignInScreen,
  SignUpScreen,
  ZoneDetailsScreen,
} from '../screens';
import { useSession } from '../session/SessionProvider';
import { useTheme } from '../theme';
import { IotConnectionProvider } from '../utils/IotConnection';
import { BottomTabs } from './BottomTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Three stacks, one at a time: auth until a session exists, then device
 * claiming until the account owns a panel, then the app.
 *
 * Swapping the whole stack rather than navigating is the React Navigation
 * pattern for auth: there is no stale history to pop back into after logout or
 * after a claim, and no imperative reset to get wrong.
 */
export function RootNavigator() {
  const { isAuthenticated, hasDevice, restoring, deviceCheckSettled } = useSession();
  const { colors, isDark } = useTheme();

  // hands React Navigation our palette so its own surfaces (the screen
  // background behind a transition) never flash the wrong colour
  const navigationTheme = useMemo<NavTheme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.error,
      },
    };
  }, [isDark, colors]);

  // A session saved by the last launch is being refreshed, or a freshly
  // signed-in / restored account's device list hasn't come back yet and
  // there's no cached device to show meanwhile — hold on a plain splash
  // rather than flashing sign-in, or the claim screen, at someone who
  // already has a device.
  const waitingOnDevices = isAuthenticated && !hasDevice && !deviceCheckSettled;
  if (restoring || waitingOnDevices) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const appReady = isAuthenticated && hasDevice;

  const navigator = (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // native slide, so transitions run on the UI thread
          animation: 'slide_from_right',
          animationDuration: 250,
          // iOS-style edge swipe; harmless and ignored on Android
          gestureEnabled: true,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Group screenOptions={{ animation: 'fade' }}>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ConfirmSignUp" component={ConfirmSignUpScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </Stack.Group>
        ) : !hasDevice ? (
          // Signed in but no claimed device yet — there is nothing to show
          // until a panel is linked, so claiming is the whole app.
          <Stack.Group screenOptions={{ animation: 'fade' }}>
            <Stack.Screen name="ClaimDevice" component={ClaimDeviceScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Tabs" component={BottomTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Help" component={HelpSupportScreen} />
            <Stack.Screen
              name="SettingsDetail"
              component={SettingsDetailScreen}
            />
            <Stack.Screen name="ZoneDetails" component={ZoneDetailsScreen} />
            {/* Reachable from Profile ("Add another device") once a device is
                already claimed — the gate above only covers the very first one. */}
            <Stack.Screen name="ClaimDevice" component={ClaimDeviceScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );

  // The app's one shared MQTT connection — subscribed to both the control
  // and config shadows, and reused for every publish too. Mounted here
  // rather than inside individual screens so navigating between them (or
  // firing a command) never opens a second connection: AWS IoT allows only
  // one live connection per clientId, so a second one would evict this one
  // and vice versa. Only mounted once there's a claimed device to actually
  // talk to.
  return appReady ? (
    <IotConnectionProvider>{navigator}</IotConnectionProvider>
  ) : (
    navigator
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
