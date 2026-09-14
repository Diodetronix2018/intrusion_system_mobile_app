import React, { forwardRef, useCallback, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../theme';
import { Typography } from './Typography';

export type InputProps = Omit<TextInputProps, 'style'> & {
  /** Optional caption above the field */
  label?: string;
  /** Marks the label with a `*` — purely visual, no validation attached */
  required?: boolean;
  /** Rendered inside the field, before the text */
  leftIcon?: React.ReactNode;
  /** Rendered inside the field, after the text */
  rightIcon?: React.ReactNode;
  /** Makes `rightIcon` tappable (password reveal, clear, picker…) */
  onRightIconPress?: () => void;
  /** Accessibility label for the tappable right icon */
  rightIconLabel?: string;
  /** Makes `leftIcon` tappable */
  onLeftIconPress?: () => void;
  /** Accessibility label for the tappable left icon */
  leftIconLabel?: string;
  /** Replaces `hint` and turns the border red when set */
  error?: string;
  /** Helper copy below the field */
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** The bordered box around the text and icons */
  fieldStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

/** The instance type behind <TextInput>, for `ref` consumers. */
export type InputRef = React.ComponentRef<typeof TextInput>;

export const Input = forwardRef<InputRef, InputProps>(function InputBase(
  {
    label,
    required = false,
    leftIcon,
    rightIcon,
    onLeftIconPress,
    onRightIconPress,
    leftIconLabel,
    rightIconLabel,
    error,
    hint,
    containerStyle,
    fieldStyle,
    inputStyle,
    labelStyle,
    editable = true,
    multiline = false,
    onBlur,
    onFocus,
    ...textInputProps
  },
  ref,
) {
  const theme = useTheme();
  const { colors, radius, sizing, spacing, typography } = theme;
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
    event => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
    event => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  // error wins over focus so a failing field always reads as failing
  const borderColor = error
    ? colors.error
    : focused
    ? colors.inputBorderFocused
    : colors.inputBorder;

  const renderAffix = (
    node: React.ReactNode,
    onPress: (() => void) | undefined,
    accessibilityLabel: string | undefined,
    side: 'left' | 'right',
  ) => {
    if (!node) {
      return null;
    }
    const style = [
      styles.affix,
      side === 'left'
        ? { marginRight: spacing.md }
        : { marginLeft: spacing.md },
    ];
    if (!onPress) {
      return <View style={style}>{node}</View>;
    }
    return (
      <Pressable
        onPress={onPress}
        hitSlop={sizing.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={style}
      >
        {node}
      </Pressable>
    );
  };

  const fieldLayout = {
    minHeight: sizing.control,
    borderRadius: radius.md,
    borderColor,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.lg,
    // a single-line field centres its content; a multiline one grows
    paddingVertical: multiline ? spacing.md : 0,
    alignItems: multiline ? ('flex-start' as const) : ('center' as const),
    opacity: editable ? 1 : 0.6,
  };

  return (
    <View style={containerStyle}>
      {!!label && (
        <Typography
          variant="label"
          color={colors.inputLabel}
          style={[styles.label, { marginBottom: spacing.sm }, labelStyle]}
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Typography>
      )}

      <View
        style={[styles.field, fieldLayout, fieldStyle]}
      >
        {renderAffix(leftIcon, onLeftIconPress, leftIconLabel, 'left')}

        <TextInput
          ref={ref}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={colors.inputPlaceholder}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            typography.body,
            { color: colors.inputText },
            inputStyle,
          ]}
          {...textInputProps}
        />

        {renderAffix(rightIcon, onRightIconPress, rightIconLabel, 'right')}
      </View>

      {(!!error || !!hint) && (
        <Typography
          variant="caption"
          align="left"
          color={error ? colors.error : colors.textSecondary}
          style={{ marginTop: spacing.sm }}
        >
          {error || hint}
        </Typography>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  label: {
    // keeps the label from inheriting a parent's centre alignment
    textAlign: 'left',
  },
  field: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    // RN adds its own vertical padding on Android; the wrapper owns spacing
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  affix: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
