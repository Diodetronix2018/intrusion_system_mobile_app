import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { fontFor, useTheme } from '../theme';
import { Typography } from './Typography';

/**
 * Small boxed numeric field with a trailing unit, e.g. `255  sec`.
 *
 * Clamps to [min, max] as you type, so the value can never leave range even
 * momentarily, and normalises the text on blur (an emptied field returns to
 * `min` rather than staying blank).
 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  unit,
  accessibilityLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  accessibilityLabel?: string;
}) {
  const { colors, radius, spacing } = useTheme();
  const [text, setText] = useState(String(value));

  const maxLength = String(max).length;

  const handleChange = (next: string) => {
    let digits = next.replace(/\D/g, '').slice(0, maxLength);
    if (digits !== '' && Number(digits) > max) {
      digits = String(max);
    }
    setText(digits);
    if (digits !== '') {
      onChange(Math.max(min, Number(digits)));
    }
  };

  const handleBlur = () => {
    const parsed = text === '' ? min : Number(text);
    const clamped = Math.min(max, Math.max(min, parsed));
    setText(String(clamped));
    onChange(clamped);
  };

  return (
    <View
      style={[
        styles.box,
        {
          gap: spacing.xs + 2,
          borderRadius: radius.sm,
          borderColor: colors.border,
          backgroundColor: colors.chipBackground,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      <TextInput
        value={text}
        onChangeText={handleChange}
        onBlur={handleBlur}
        keyboardType="number-pad"
        maxLength={maxLength}
        selectionColor={colors.primary}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.input,
          fontFor('700', 'poppins'),
          { color: colors.primary },
        ]}
      />

      {!!unit && (
        <Typography variant="caption" size={12} color={colors.textSecondary}>
          {unit}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minWidth: 73,
    minHeight: 37,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    minWidth: 24,
    textAlign: 'right',
    // the box owns the spacing; Android adds its own otherwise
    padding: 0,
  },
});
