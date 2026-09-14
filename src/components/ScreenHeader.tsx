import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon } from '../icons';
import { useTheme } from '../theme';
import { useResponsive } from '../utils/responsive';
import { Typography } from './Typography';

/** Title bar with a back button, for screens pushed over the tabs. */
export function ScreenHeader({
  title,
  onBack,
  background,
}: {
  title: string;
  onBack?: () => void;
  /** Matches the page when the screen uses a grouped background */
  background?: string;
}) {
  const { t } = useTranslation();
  const { colors, spacing, sizing } = useTheme();
  const { gutter } = useResponsive();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const goBack = onBack ?? (() => navigation.goBack());
  const showBack = onBack !== undefined || navigation.canGoBack();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.md,
          paddingHorizontal: gutter,
          backgroundColor: background ?? colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {showBack ? (
        <Pressable
          onPress={goBack}
          hitSlop={sizing.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.back}
        >
          <ArrowLeftIcon size={22} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}

      <Typography
        variant="captionBold"
        size={17}
        color={colors.text}
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Typography>

      {/* balances the back button so the title stays optically centred */}
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});
