import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Screen, ScreenHeader } from '../../../../components';
import { useTheme } from '../../../../theme';
import { useEditGuard } from '../../useEditGuard';
import { ToggleRow, ZoneToggleCard } from './ZoneToggleCard';
import { TAMPER_INDEX, usePartSetting } from './usePartSetting';

export function PartSettingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { values, toggle, save, saving } = usePartSetting();
  const { requireStayMode } = useEditGuard();

  const rows: ToggleRow[] = values.map((enabled, index) => ({
    key: String(index),
    badge: String(index + 1),
    label:
      index === TAMPER_INDEX
        ? t('partSetting.tamper')
        : t('partSetting.zone', { number: index + 1 }),
    enabled,
    onChange: next => toggle(index, next),
  }));

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
            title={t('common.saveConfiguration')}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        }
      >
        <ZoneToggleCard rows={rows} />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
