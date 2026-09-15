import React from 'react';
import { View } from 'react-native';

import { Typography } from '../../components';
import { useTheme } from '../../theme';

/** Title + explanation above the form, for the verification and reset steps. */
export function AuthPrompt({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing.xl, gap: spacing.xs }}>
      <Typography variant="subheading" size={20} color={colors.text}>
        {title}
      </Typography>
      <Typography variant="caption" color={colors.textSecondary}>
        {subtitle}
      </Typography>
    </View>
  );
}
