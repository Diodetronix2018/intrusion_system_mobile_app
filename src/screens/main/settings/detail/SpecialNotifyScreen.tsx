import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  ChipGroup,
  ChipOption,
  FeatureCard,
  Screen,
  ScreenHeader,
  ToggleSwitch,
  Typography,
} from '../../../../components';
import { PlugIcon, UsersIcon } from '../../../../icons';
import { useTheme } from '../../../../theme';
import {
  USER_GROUPS,
  UserGroup,
  useSpecialNotify,
} from './useSpecialNotify';

export function SpecialNotifyScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { settings, setAlert, setUserGroup, save, saving } = useSpecialNotify();

  const groupOptions: ChipOption<UserGroup>[] = USER_GROUPS.map(group => ({
    value: group,
    label: t(`specialNotify.groups.${group}`),
  }));

  const handleSave = async () => {
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
        title={t('settings.options.specialNotify.title')}
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
          {t('settings.options.specialNotify.subtitle')}
        </Typography>

        <FeatureCard
          shadow="soft"
          icon={<PlugIcon size={20} color={colors.onPrimary} />}
          title={t('specialNotify.acFail.title')}
          description={t('specialNotify.acFail.description')}
          trailing={
            <ToggleSwitch
              value={settings.acFail}
              onValueChange={next => setAlert('acFail', next)}
              accessibilityLabel={t('specialNotify.acFail.title')}
            />
          }
        />

        <FeatureCard
          shadow="soft"
          icon={
            // a raster illustration, not a glyph — it ships its own white
            // battery and red warning triangle
            <Image
              source={require('../../../../assets/images/battery-alert.png')}
              style={styles.batteryIcon}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          }
          title={t('specialNotify.batteryFail.title')}
          description={t('specialNotify.batteryFail.description')}
          trailing={
            <ToggleSwitch
              value={settings.batteryFail}
              onValueChange={next => setAlert('batteryFail', next)}
              accessibilityLabel={t('specialNotify.batteryFail.title')}
            />
          }
        />

        <FeatureCard
          shadow="soft"
          icon={<UsersIcon size={20} color={colors.onPrimary} />}
          title={t('specialNotify.users.title')}
          description={t('specialNotify.users.description')}
        >
          <ChipGroup<UserGroup>
            accessibilityLabel={t('specialNotify.users.title')}
            options={groupOptions}
            selected={settings.userGroup}
            onSelect={setUserGroup}
          />
        </FeatureCard>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  batteryIcon: {
    width: 22,
    height: 22,
  },
});
