import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Button, Icon, Typography } from '../../../../components';
import { useTheme } from '../../../../theme';
import { useResponsive } from '../../../../utils/responsive';
import { useConfigStatus } from '../../useConfigStatus';
import { isBnkValueEmpty } from './useBankDetails';

const ICON_SIZE = 56;

/**
 * Nudges the user to fill in Bank Details once per app open, if the device's
 * `bnk` shadow value is still empty by the time it loads — never before
 * (`isBnkValueEmpty` treats "not loaded yet" as not-empty, so this can't
 * flash before the real value arrives) and never more than once per launch
 * (`dismissed` is plain component state: it starts fresh every time this
 * mounts, which only happens once per signed-in session, and there's
 * nothing persisted to make it "remember" across a real app close/reopen).
 */
export function BankDetailsReminderModal() {
  const { t } = useTranslation();
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const navigation = useNavigation();
  const { reported } = useConfigStatus();
  const [dismissed, setDismissed] = useState(false);

  const visible = !dismissed && isBnkValueEmpty(reported?.bnk);

  const goToBankDetails = () => {
    setDismissed(true);
    navigation.navigate('SettingsDetail', { optionId: 'bankDetails' });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setDismissed(true)}
    >
      <View style={[styles.anchor, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.card,
            {
              maxWidth: contentMaxWidth,
              gap: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: colors.card,
              padding: spacing.xl,
            },
            layeredShadow,
          ]}
        >
          <View
            style={[
              styles.iconWell,
              { borderRadius: ICON_SIZE / 2, backgroundColor: colors.primaryMuted },
            ]}
          >
            <Icon name="business-outline" size={26} color={colors.primary} />
          </View>

          <Typography
            variant="cardTitle"
            size={17}
            align="center"
            color={colors.primary}
          >
            {t('bankDetails.reminder.title')}
          </Typography>

          <Typography
            variant="cardSubtitle"
            align="center"
            color={colors.textSecondary}
          >
            {t('bankDetails.reminder.body')}
          </Typography>

          <Button
            title={t('bankDetails.reminder.action')}
            onPress={goToBankDetails}
            style={{ marginTop: spacing.sm }}
          />

          <Pressable
            onPress={() => setDismissed(true)}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Typography
              variant="captionBold"
              align="center"
              color={colors.textSecondary}
            >
              {t('bankDetails.reminder.later')}
            </Typography>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  anchor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    // 5% either side, so it reads as a card rather than a full-width sheet
    width: '90%',
    alignItems: 'center',
  },
  iconWell: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
