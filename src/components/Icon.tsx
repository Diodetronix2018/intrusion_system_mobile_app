/**
 * Thin wrapper over @react-native-vector-icons so screens import one component
 * instead of picking a font family at every call site.
 *
 *   <Icon name="notifications-outline" />                      // Ionicons
 *   <Icon family="material" name="toggle-switch-off-outline" />
 *
 * Font files are linked automatically by autolinking — no manual
 * Info.plist / fonts.gradle edits needed — but adding a new family means
 * rebuilding the native app, not just reloading Metro.
 */
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { useTheme } from '../theme';

export type IconFamily = 'ionicons' | 'material';

export type VectorIconProps = {
  name: string;
  family?: IconFamily;
  size?: number;
  color?: string;
};

type GlyphProps = { name: string; size: number; color: string };

export function Icon({ name, family = 'ionicons', size, color }: VectorIconProps) {
  const theme = useTheme();
  const resolvedSize = size ?? theme.sizing.iconLg;
  const resolvedColor = color ?? theme.colors.textSecondary;

  const Component = (
    family === 'material' ? MaterialDesignIcons : Ionicons
  ) as unknown as React.ComponentType<GlyphProps>;

  return <Component name={name} size={resolvedSize} color={resolvedColor} />;
}
