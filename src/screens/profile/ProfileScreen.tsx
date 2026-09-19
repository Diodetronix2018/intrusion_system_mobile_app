import React, { useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  LanguageCard,
  PreferenceCard,
  Screen,
  ScreenHeader,
  SectionLabel,
  ThemeCard,
  Typography,
} from '../../components';
import { LogOutIcon, UserIcon } from '../../icons';
import { useSession } from '../../session/SessionProvider';
import { useTheme } from '../../theme';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, radius, spacing, cardShadow } = useTheme();
  const navigation = useNavigation();
  const { user, session, signOut } = useSession();

  // Logging out revokes the refresh token, so the next launch needs a full
  // sign-in again — worth one tap of confirmation.
  const confirmSignOut = useCallback(() => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: signOut },
    ]);
  }, [signOut, t]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundGrouped }]}>
      <ScreenHeader
        title={t('profile.title')}
        background={colors.backgroundGrouped}
      />

      <Screen edges={['left', 'right']} background={colors.backgroundGrouped}>
        <SectionLabel>{t('profile.account')}</SectionLabel>

        <View
          style={[
            styles.identity,
            {
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.card,
              marginBottom: spacing['2xl'],
              gap: spacing.lg,
            },
            cardShadow,
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
            <UserIcon size={26} color={colors.primary} />
          </View>

          <View style={styles.identityText}>
            <Typography
              variant="cardTitle"
              size={16}
              align="left"
              color={colors.primary}
              numberOfLines={1}
            >
              {user?.name || t('profile.guest')}
            </Typography>
            <Typography
              variant="cardSubtitle"
              align="left"
              color={colors.textSecondary}
              numberOfLines={1}
              style={{ marginTop: spacing.xs }}
            >
              {user?.email || t('profile.noEmail')}
            </Typography>
          </View>
        </View>

        <SectionLabel>{t('profile.devices')}</SectionLabel>

        <PreferenceCard
          icon="add-circle-outline"
          title={t('profile.addDevice.title')}
          subtitle={t('profile.addDevice.subtitle')}
          value={
            session?.devices?.length
              ? t('profile.addDevice.count', { count: session.devices.length })
              : undefined
          }
          onPress={() => navigation.navigate('ClaimDevice')}
        />

        <SectionLabel>{t('profile.preferences')}</SectionLabel>

        <ThemeCard />
        <LanguageCard />

        <PreferenceCard
          icon="headset-outline"
          title={t('help.title')}
          subtitle={t('profile.helpSubtitle')}
          onPress={() => navigation.navigate('Help')}
        />

        <Button
          title={t('profile.logout')}
          variant="error"
          onPress={confirmSignOut}
          leftIcon={<LogOutIcon size={18} color={colors.onError} />}
          style={{ marginTop: spacing.lg }}
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
});
