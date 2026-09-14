import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '../../components';
import { useTheme } from '../../theme';

/** "Don't have an account? Register" — plain copy with a tappable span. */
export function AuthFooter({
  prompt,
  action,
  onPress,
}: {
  prompt: string;
  action: string;
  onPress?: () => void;
}) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.row, { paddingTop: spacing.lg }]}>
      <Typography variant="caption" color={colors.textSecondary}>
        {prompt}{' '}
        <Typography
          variant="captionBold"
          color={colors.link}
          onPress={onPress}
          accessibilityRole="link"
        >
          {action}
        </Typography>
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
