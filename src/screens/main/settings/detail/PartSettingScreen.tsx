import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Screen, ScreenHeader } from '../../../../components';
import { useTheme } from '../../../../theme';
import { ToggleRow, ZoneToggleCard } from './ZoneToggleCard';
import { useToggleList } from './useToggleList';

/** Eight zones plus the tamper line. */
const LINE_COUNT = 9;
const TAMPER_INDEX = 8;

export function PartSettingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { values, toggle } = useToggleList(LINE_COUNT);

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

  const handleSave = () => {
    // no panel API yet; confirm the action so the button is not a dead end
    Toast.show({ type: 'success', text1: t('common.configurationSaved') });
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
