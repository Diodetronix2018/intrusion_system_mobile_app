import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { elevation, useTheme } from '../theme';
import { Typography } from './Typography';

export type ButtonVariant = 'contained' | 'outline' | 'link' | 'error';
export type ButtonSize = 'sm' | 'md';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  /**
   * `contained` – filled brand button with the drop shadow (the default)
   * `outline`   – same shape, brand border and text on a clear background
   * `link`      – text only, no chrome
   * `error`     – filled red, for destructive actions like logout
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Stretches to the width of the parent */
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  variant = 'contained',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const { colors, radius, sizing, spacing } = theme;

  const isLink = variant === 'link';
  const isDisabled = disabled || loading;
  const height = size === 'sm' ? 44 : sizing.control;

  const base: ViewStyle = isLink
    ? {
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        paddingVertical: spacing.sm,
        paddingHorizontal: 0,
      }
    : {
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        height,
        // half the height, so the caps stay perfectly round at either size
        borderRadius: size === 'sm' ? height / 2 : radius.pill,
        paddingHorizontal: spacing['2xl'],
      };

  const variantStyle: ViewStyle =
    variant === 'contained'
      ? { backgroundColor: colors.primary, ...theme.shadow }
      : variant === 'error'
      ? {
          backgroundColor: colors.errorSurface,
          // same 0/8/16 drop as the brand button, tinted red
          ...elevation(colors.errorSurface),
        }
      : variant === 'outline'
      ? {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        }
      : {};

  const isFilled = variant === 'contained' || variant === 'error';

  const labelColor =
    variant === 'error'
      ? colors.onError
      : variant === 'contained'
      ? colors.onPrimary
      : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        base,
        variantStyle,
        // the shadow would otherwise keep implying an affordance that is gone
        isDisabled && isFilled ? styles.disabledFilled : null,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <View style={styles.content}>
          {!!leftIcon && (
            <View style={{ marginRight: spacing.sm }}>{leftIcon}</View>
          )}
          <Typography
            variant="button"
            color={labelColor}
            numberOfLines={1}
            style={[isLink && styles.linkLabel, textStyle]}
          >
            {title}
          </Typography>
          {!!rightIcon && (
            <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.45,
  },
  disabledFilled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
