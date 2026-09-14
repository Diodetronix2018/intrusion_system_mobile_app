import React, { useCallback } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Icon,
  Screen,
  ScreenHeader,
  SectionLabel,
  SettingsCard,
  Typography,
} from '../../components';
import { useTheme } from '../../theme';
import { ContactRow } from './ContactRow';

export const SUPPORT_EMAIL = 'Info@diodetronix.com';
export const SUPPORT_PHONE = '+91-9360145711';

export function HelpSupportScreen() {
  const { t } = useTranslation();
  const { colors, radius, spacing, cardShadow } = useTheme();

  // Nothing handles mailto:/tel: on a device without a mail or phone app, so
  // fall back to telling the user the address rather than failing silently.
  const openLink = useCallback(
    async (url: string, fallback: string) => {
      try {
        await Linking.openURL(url);
      } catch {
        Toast.show({ type: 'info', text1: t('help.noApp'), text2: fallback });
      }
    },
    [t],
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundGrouped }]}>
      <ScreenHeader
        title={t('help.title')}
        background={colors.backgroundGrouped}
      />

      <Screen edges={['left', 'right']} background={colors.backgroundGrouped}>
        <View
          style={[
            styles.intro,
            {
              borderRadius: radius.lg,
              backgroundColor: colors.card,
              padding: spacing.xl,
              marginBottom: spacing['2xl'],
              gap: spacing.sm,
            },
            cardShadow,
          ]}
        >
          <View
            style={[
              styles.introIcon,
              {
                backgroundColor: colors.primaryMuted,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Icon name="headset-outline" size={26} color={colors.primary} />
          </View>

          <Typography variant="captionBold" size={17} color={colors.text}>
            {t('help.introTitle')}
          </Typography>
          <Typography variant="caption" color={colors.textSecondary}>
            {t('help.introBody')}
          </Typography>
        </View>

        <SectionLabel>{t('help.contactUs')}</SectionLabel>
        <SettingsCard>
          <ContactRow
            first
            icon="mail-outline"
            label={t('help.email')}
            value={SUPPORT_EMAIL}
            onPress={() =>
              openLink(
                `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  t('help.emailSubject'),
                )}`,
                t('help.writeTo', { value: SUPPORT_EMAIL }),
              )
            }
          />
          <ContactRow
            icon="call-outline"
            label={t('help.phone')}
            value={SUPPORT_PHONE}
            // tel: takes the raw digits — the dash is only for display
            onPress={() =>
              openLink(
                `tel:${SUPPORT_PHONE.replace(/[^+\d]/g, '')}`,
                t('help.callTo', { value: SUPPORT_PHONE }),
              )
            }
          />
        </SettingsCard>

        <Typography variant="caption" color={colors.textSecondary}>
          {t('help.hours')}
        </Typography>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  intro: {
    alignItems: 'center',
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
