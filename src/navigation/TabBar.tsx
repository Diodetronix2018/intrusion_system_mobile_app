import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '../components';
import {
  BellIcon,
  HomeIcon,
  IconProps,
  LocationPinIcon,
  PhoneIcon,
  SettingsIcon,
} from '../icons';
import { useTheme } from '../theme';
import { useResponsive } from '../utils/responsive';
import type { TabParamList } from './types';

const TAB_ICONS: Record<
  keyof TabParamList,
  (props: IconProps) => React.JSX.Element
> = {
  Main: HomeIcon,
  Zone: LocationPinIcon,
  Dialer: PhoneIcon,
  Events: BellIcon,
  Settings: SettingsIcon,
};

/** The pill-style tab bar: the active tab fills with brand and goes white. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, radius, spacing } = useTheme();
  const { isSmall } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + spacing.sm,
          paddingTop: spacing.sm,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isActive = state.index === index;
        const Icon = TAB_ICONS[route.name as keyof TabParamList] ?? HomeIcon;
        const label = options.title ?? route.name;
        const contentColor = isActive
          ? colors.onPrimary
          : colors.textSecondary;
        const fill = {
          backgroundColor: isActive ? colors.primary : 'transparent',
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            style={[
              styles.tab,
              { borderRadius: radius.md, paddingVertical: spacing.sm },
              fill,
            ]}
          >
            <Icon size={isSmall ? 20 : 22} color={contentColor} />
            <Typography
              variant="caption"
              size={isSmall ? 10 : 11}
              weight={isActive ? '700' : '400'}
              color={contentColor}
              numberOfLines={1}
              style={{ marginTop: spacing.xs }}
            >
              {label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
