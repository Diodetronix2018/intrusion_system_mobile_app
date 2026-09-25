import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  FeatureCard,
  Icon,
  Screen,
  ScreenHeader,
  ToggleSwitch,
  Typography,
} from '../../../../components';
import { useTheme } from '../../../../theme';
import { useEditGuard } from '../../useEditGuard';
import { useHooterNotify } from './useHooterNotify';

export function HooterNotifyScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { enabled, setEnabled, save, saving } = useHooterNotify();
  const { requireStayMode } = useEditGuard();

  const handleSave = async () => {
    if (requireStayMode()) return;
    try {
      await save();
      Toast.show({ type: 'success', text1: t('common.configurationSaved') });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('common.configurationFailed'),
        text2: err?.message,
      });
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSubtle }]}>
      <ScreenHeader
        title={t('settings.options.hooterNotify.title')}
        background={colors.backgroundSubtle}
      />

      <Screen
        edges={['left', 'right']}
        background={colors.backgroundSubtle}
        contentContainerStyle={{ gap: spacing.md }}
        footer={
          <Button
            title={t('common.saveConfiguration')}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        }
      >
        <Typography
          variant="caption"
          size={13}
          align="left"
          color={colors.textSecondary}
          style={{ marginBottom: spacing.xs }}
        >
          {t('settings.options.hooterNotify.subtitle')}
        </Typography>

        <FeatureCard
          shadow="soft"
          icon={
            <Icon name="megaphone-outline" size={20} color={colors.onPrimary} />
          }
          title={t('hooterNotify.title')}
          description={t('hooterNotify.description')}
          trailing={
            <ToggleSwitch
              value={enabled}
              onValueChange={setEnabled}
              accessibilityLabel={t('hooterNotify.title')}
            />
          }
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
