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
  MainStatusProvider,
  ProfileScreen,
  ResetPasswordScreen,
  SettingsDetailScreen,
  SignInScreen,
  SignUpScreen,
  ZoneDetailsScreen,
} from '../screens';
import { useSession } from '../session/SessionProvider';
import { useTheme } from '../theme';
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
  const { isAuthenticated, hasDevice, restoring } = useSession();
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

  // A session saved by the last launch is being refreshed — hold on a plain
  // splash rather than flashing sign-in at someone who is already signed in.
  if (restoring) {
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
          // Signed in but no `custom:thingName` yet — there is nothing to show
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
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );

  // One shared live-status subscription for every screen that reads it
  // (Main, Zone Details, …) — mounted here rather than inside those screens
  // so switching between them never opens a second MQTT connection. Only
  // mounted once there's a claimed device to actually subscribe to.
  return appReady ? (
    <MainStatusProvider>{navigator}</MainStatusProvider>
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
