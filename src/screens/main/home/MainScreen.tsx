import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Screen } from '../../../components';
import { useTheme } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { HomeAwayGlyph, HomeGlyph } from './ModeGlyphs';
import { ModeCard } from './ModeCard';
import { QuickActionCard } from './QuickActionCard';
import {
  AllGlyph,
  MuteGlyph,
  PartGlyph,
  ResetGlyph,
} from './QuickActionGlyphs';
import { StatusCard } from './StatusCard';
import { SystemStatusCard } from './SystemStatusCard';
import { LatestActivityCard } from './LatestActivityCard';
import { ZoneStatusCard } from './ZoneStatusCard';

type ArmMode = 'stay' | 'away';

const QUICK_ACTIONS = [
  { key: 'all', glyph: AllGlyph },
  { key: 'part', glyph: PartGlyph },
  { key: 'mute', glyph: MuteGlyph },
  { key: 'reset', glyph: ResetGlyph },
] as const;

export function MainScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { gutter } = useResponsive();
  const navigation = useNavigation();
  const [mode, setMode] = useState<ArmMode>('stay');

  return (
    <Screen
      edges={['left', 'right']}
      background={colors.background}
      // the status band runs edge to edge, so the gutter moves inside it
      padded={false}
    >
      <View
        style={[
          styles.statusBand,
          {
            backgroundColor: colors.backgroundSoft,
            paddingHorizontal: gutter,
            paddingBottom: spacing.lg,
          },
        ]}
      >
        <StatusCard
          title={t('main.status.title')}
          summary={t('main.status.summary', {
            ago: t('main.status.minutesAgo', { count: 2 }),
          })}
        />
      </View>

      <View
        style={[
          styles.modes,
          {
            paddingHorizontal: gutter,
            paddingTop: spacing.xl,
            gap: spacing.md,
          },
        ]}
      >
        <ModeCard
          label={t('main.modes.stay')}
          active={mode === 'stay'}
          onPress={() => setMode('stay')}
          glyph={HomeGlyph}
        />
        <ModeCard
          label={t('main.modes.away')}
          active={mode === 'away'}
          onPress={() => setMode('away')}
          glyph={HomeAwayGlyph}
        />
      </View>

      <View
        style={[
          styles.actions,
          {
            paddingHorizontal: gutter,
            paddingTop: spacing.lg,
            gap: spacing.sm,
          },
        ]}
      >
        {QUICK_ACTIONS.map(action => (
          <QuickActionCard
            key={action.key}
            label={t(`main.actions.${action.key}`)}
            glyph={action.glyph}
            onPress={() => console.log('quick action', action.key)}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: gutter, paddingTop: spacing.xl }}>
        {/* statuses come from the panel once the API lands */}
        <SystemStatusCard
          statuses={{ battery: 'warning', tamper: 'failed' }}
        />
      </View>

      <View style={{ paddingHorizontal: gutter, paddingTop: spacing.lg }}>
        {/* a preview; the full list lives on the Zone tab */}
        <ZoneStatusCard
          zones={[{ number: 1, locationKey: 'mainDoor', condition: 'normal' }]}
          onViewAll={() => navigation.navigate('Tabs', { screen: 'Zone' })}
        />
      </View>

      <View style={{ paddingHorizontal: gutter, paddingTop: spacing.lg }}>
        {/* a preview; the full log lives on the Events tab */}
        <LatestActivityCard
          entries={[
            {
              id: '1',
              time: '18:12:11',
              eventKey: 'alarm',
              zoneNumber: 1,
              locationKey: 'mainDoor',
              severity: 'alarm',
            },
          ]}
          onViewAll={() => navigation.navigate('Tabs', { screen: 'Events' })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusBand: {
    width: '100%',
  },
  modes: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});
