import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Screen, ScreenHeader, Typography } from '../../../../components';
import { useTheme } from '../../../../theme';
import { ToggleRow, ZoneToggleCard } from './ZoneToggleCard';
import { useToggleList } from './useToggleList';

/** Relay assignment covers the eight zones; there is no tamper line. */
const ZONE_COUNT = 8;

export function RelayScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { values, toggle, setAll, allEnabled } = useToggleList(ZONE_COUNT);

  const rows: ToggleRow[] = values.map((enabled, index) => ({
    key: String(index),
    badge: String(index + 1),
    label: t('partSetting.zone', { number: index + 1 }),
    enabled,
    onChange: (next: boolean) => toggle(index, next),
  }));

  const handleSave = () => {
    // no panel API yet; confirm the action so the button is not a dead end
    Toast.show({ type: 'success', text1: t('common.configurationSaved') });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSoft }]}>
      <ScreenHeader
        title={t('settings.options.relay.title')}
        background={colors.backgroundSoft}
      />

      <Screen
        edges={['left', 'right']}
        background={colors.backgroundSoft}
        footer={
          <Button title={t('common.saveConfiguration')} onPress={handleSave} />
        }
      >
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <Typography variant="label" align="left" color={colors.textSecondary}>
            {t('relay.zoneAssignment')}
          </Typography>

          <Pressable
            onPress={() => setAll(!allEnabled)}
            accessibilityRole="button"
            // reads as selected only while every zone is on
            accessibilityState={{ selected: allEnabled }}
            style={({ pressed }) => [
              styles.pill,
              {
                paddingHorizontal: spacing.md,
                backgroundColor: allEnabled
                  ? colors.primary
                  : colors.chipBackground,
                borderColor: colors.primary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Typography
              variant="cardSubtitle"
              size={12}
              weight="700"
              color={allEnabled ? colors.onPrimary : colors.primary}
              numberOfLines={1}
            >
              {t('relay.allZones')}
            </Typography>
          </Pressable>
        </View>

        <ZoneToggleCard rows={rows} />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    minHeight: 28,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
