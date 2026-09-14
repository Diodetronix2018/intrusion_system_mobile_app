import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen, Typography } from '../../components';
import { useTheme } from '../../theme';

/** Stand-in body for the tab screens until their real content lands. */
export function PlaceholderScreen({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  const { colors, spacing, radius } = useTheme();

  return (
    <Screen scrollable={false} edges={['left', 'right']}>
      <View style={styles.center}>
        <View
          style={[
            styles.iconWell,
            {
              backgroundColor: colors.primaryMuted,
              borderRadius: radius.lg,
              marginBottom: spacing['2xl'],
            },
          ]}
        >
          {icon}
        </View>

        <Typography variant="heading" color={colors.text}>
          {title}
        </Typography>

        <Typography
          variant="caption"
          color={colors.textSecondary}
          style={{ marginTop: spacing.md }}
        >
          {description}
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWell: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
