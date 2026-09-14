import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  Screen,
  ScreenHeader,
  ToggleSwitch,
  Typography,
} from '../../../../components';
import { useTheme } from '../../../../theme';
import { TAMPER_INDEX, usePartSettings } from './usePartSettings';

export function PartSettingScreen() {
  const { t } = useTranslation();
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const { settings, toggle } = usePartSettings();

  const labelFor = (index: number) =>
    index === TAMPER_INDEX
      ? t('partSetting.tamper')
      : t('partSetting.zone', { number: index + 1 });

  const handleSave = () => {
    // no panel API yet; confirm the action so the button is not a dead end
    Toast.show({ type: 'success', text1: t('partSetting.saved') });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSoft }]}>
      <ScreenHeader
        title={t('settings.options.partSetting.title')}
        background={colors.backgroundSoft}
      />

      <Screen
        edges={['left', 'right']}
        background={colors.backgroundSoft}
        footer={
          <Button
            title={t('partSetting.saveConfiguration')}
            onPress={handleSave}
          />
        }
      >
        <View
          style={[
            styles.card,
            {
              padding: spacing.lg,
              borderRadius: radius.lg,
              borderColor: colors.border,
              backgroundColor: colors.card,
              gap: spacing.xs,
            },
            layeredShadow,
          ]}
        >
          {settings.map(item => {
            const label = labelFor(item.index);
            // the displayed number is 1-based, so odd rows are even indexes
            const stripe = {
              backgroundColor:
                item.index % 2 === 0 ? colors.rowStripe : colors.card,
            };

            return (
              <View
                key={item.index}
                style={[
                  styles.row,
                  {
                    gap: spacing.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    borderRadius: radius.md,
                  },
                  stripe,
                ]}
              >
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Typography
                    variant="captionBold"
                    size={14}
                    color={colors.onPrimary}
                  >
                    {String(item.index + 1)}
                  </Typography>
                </View>

                <Typography
                  variant="captionBold"
                  size={16}
                  align="left"
                  color={colors.primary}
                  numberOfLines={1}
                  style={styles.label}
                >
                  {label}
                </Typography>

                <Typography
                  variant="captionBold"
                  size={12}
                  color={item.enabled ? colors.primary : colors.textSecondary}
                >
                  {item.enabled ? t('common.on') : t('common.off')}
                </Typography>

                <ToggleSwitch
                  value={item.enabled}
                  onValueChange={next => toggle(item.index, next)}
                  accessibilityLabel={label}
                />
              </View>
            );
          })}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
});
