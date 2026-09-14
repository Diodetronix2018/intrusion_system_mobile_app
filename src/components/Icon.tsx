/**
 * Thin wrapper over @react-native-vector-icons so screens import one component
 * instead of picking a font family at every call site.
 *
 *   <Icon name="notifications-outline" />                 // Ionicons
 *   <Icon family="material" name="shield-lock-outline" /> // Material Design
 *
 * Font files are linked automatically by the RN autolinking config in
 * react-native.config.js — no manual Info.plist / fonts.gradle edits needed.
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

export function Icon({
  name,
  family = 'ionicons',
  size,
  color,
}: VectorIconProps) {
  const theme = useTheme();
  const resolvedSize = size ?? theme.sizing.iconLg;
  const resolvedColor = color ?? theme.colors.textSecondary;

  const Component = (
    family === 'material' ? MaterialDesignIcons : Ionicons
  ) as React.ComponentType<{ name: string; size: number; color: string }>;

  return <Component name={name} size={resolvedSize} color={resolvedColor} />;
}
