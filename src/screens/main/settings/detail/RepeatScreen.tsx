import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  ChipGroup,
  ChipOption,
  FeatureCard,
  Icon,
  Screen,
  ScreenHeader,
} from '../../../../components';
import { UsersIcon, Volume2Icon } from '../../../../icons';
import { useTheme } from '../../../../theme';
import { useEditGuard } from '../../useEditGuard';
import {
  REPEAT_COUNTS,
  RepeatCount,
  RepeatKey,
  useRepeatSettings,
} from './useRepeatSettings';

export function RepeatScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { settings, set, save, saving } = useRepeatSettings();
  const { requireStayMode } = useEditGuard();

  // "1 Time" / "2 Times" — i18next picks the plural form per language
  const options: ChipOption<RepeatCount>[] = REPEAT_COUNTS.map(count => ({
    value: count,
    label: t('repeat.times', { count }),
  }));

  const cards: { key: RepeatKey; icon: React.ReactNode }[] = [
    {
      key: 'call',
      icon: <Icon name="call-outline" size={20} color={colors.onPrimary} />,
    },
    { key: 'voice', icon: <Volume2Icon size={20} color={colors.onPrimary} /> },
    { key: 'admin', icon: <UsersIcon size={20} color={colors.onPrimary} /> },
  ];

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
        title={t('settings.options.repeat.title')}
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
        {cards.map(card => (
          <FeatureCard
            key={card.key}
            icon={card.icon}
            title={t(`repeat.${card.key}.title`)}
            description={t(`repeat.${card.key}.description`)}
          >
            <ChipGroup<RepeatCount>
              accessibilityLabel={t(`repeat.${card.key}.title`)}
              options={options}
              selected={settings[card.key]}
              onSelect={count => set(card.key, count)}
            />
          </FeatureCard>
        ))}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
