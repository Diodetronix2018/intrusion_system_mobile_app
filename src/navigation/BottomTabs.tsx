import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '../components';
import {
  DialerScreen,
  EventsScreen,
  MainScreen,
  SettingsScreen,
  ZoneScreen,
} from '../screens';
import { useTheme } from '../theme';
import { TabBar } from './TabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * React Navigation *calls* `tabBar` as a plain function rather than mounting
 * it, so the bar has to be returned as an element for its hooks to run inside
 * a real component. Kept at module scope so the callback identity is stable.
 */
const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

/** The app bar plus the five tabs. Tab labels come from the translations. */
export function BottomTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <AppHeader />

      <Tab.Navigator
        screenOptions={{ headerShown: false, animation: 'shift' }}
        tabBar={renderTabBar}
      >
        <Tab.Screen
          name="Main"
          component={MainScreen}
          options={{ title: t('tabs.main') }}
        />
        <Tab.Screen
          name="Zone"
          component={ZoneScreen}
          options={{ title: t('tabs.zone') }}
        />
        <Tab.Screen
          name="Dialer"
          component={DialerScreen}
          options={{ title: t('tabs.dialer') }}
        />
        <Tab.Screen
          name="Events"
          component={EventsScreen}
          options={{ title: t('tabs.events') }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: t('tabs.settings') }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
