import React, { useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  HelpSupportScreen,
  ProfileScreen,
  SettingsDetailScreen,
  SignInScreen,
  SignUpScreen,
} from '../screens';
import { useSession } from '../session/SessionProvider';
import { useTheme } from '../theme';
import { BottomTabs } from './BottomTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth screens until a session exists, then the app.
 *
 * Swapping the whole stack on `isAuthenticated` is the React Navigation
 * pattern for auth: there is no stale history to pop back into after logout,
 * and no imperative reset to get wrong.
 */
export function RootNavigator() {
  const { isAuthenticated, signIn } = useSession();
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

  return (
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
        {isAuthenticated ? (
          <Stack.Group>
            <Stack.Screen name="Tabs" component={BottomTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Help" component={HelpSupportScreen} />
            <Stack.Screen
              name="SettingsDetail"
              component={SettingsDetailScreen}
            />
          </Stack.Group>
        ) : (
          <Stack.Group screenOptions={{ animation: 'fade' }}>
            <Stack.Screen name="SignIn">
              {() => (
                <SignInScreen
                  onSignIn={credentials =>
                    // the form collects one identifier; treat an address as
                    // the email and anything else as the display name
                    signIn(
                      credentials.identifier.includes('@')
                        ? {
                            name: credentials.identifier.split('@')[0],
                            email: credentials.identifier,
                          }
                        : { name: credentials.identifier, email: '' },
                    )
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SignUp">
              {() => (
                <SignUpScreen
                  onSignUp={values =>
                    signIn({ name: values.fullName, email: values.email })
                  }
                />
              )}
            </Stack.Screen>
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
