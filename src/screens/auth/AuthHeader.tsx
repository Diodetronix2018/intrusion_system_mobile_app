import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Logo, Typography } from '../../components';
import { useTheme } from '../../theme';
import { useResponsive } from '../../utils/responsive';

/** Logo → "Diodetronix" → "DTX Secure", shared by sign in and sign up. */
export function AuthHeader() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { isSmall, isTablet, moderateScale } = useResponsive();

  const logoSize = isSmall ? 88 : isTablet ? 132 : 110;

  return (
    <View style={{ marginBottom: spacing['3xl'] }}>

      <Logo size={logoSize} />

      <Typography
        variant="heading"
        size={moderateScale(26)}
        color={colors.primary}
        style={{ marginTop: spacing.lg }}
      >
        {t('brand.name')}
      </Typography>

      <Typography
        variant="subheading"
        size={moderateScale(20)}
        color={colors.textSecondary}
      >
        {t('brand.tagline')}
      </Typography>
    </View>
  );
}
