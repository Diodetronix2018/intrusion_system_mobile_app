import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';
import { StatusChip } from './StatusChip';
import { StatusTile, SubsystemStatus } from './StatusTile';
import {
  AcGlyph,
  BatteryGlyph,
  HooterGlyph,
  SignalGlyph,
  TamperGlyph,
  ZoneGlyph,
} from './SystemStatusGlyphs';

export type SubsystemKey =
  | 'zone'
  | 'battery'
  | 'ac'
  | 'hooter'
  | 'tamper'
  | 'signal';

const SUBSYSTEMS: {
  key: SubsystemKey;
  glyph: React.ComponentType<{ size: number; color: string }>;
}[] = [
  { key: 'zone', glyph: ZoneGlyph },
  { key: 'battery', glyph: BatteryGlyph },
  { key: 'ac', glyph: AcGlyph },
  { key: 'hooter', glyph: HooterGlyph },
  { key: 'tamper', glyph: TamperGlyph },
  { key: 'signal', glyph: SignalGlyph },
];

/** Three per row, two rows. */
const COLUMNS = 3;

export function SystemStatusCard({
  statuses,
  onPressTile,
}: {
  /** Status per subsystem; anything missing is treated as healthy */
  statuses?: Partial<Record<SubsystemKey, SubsystemStatus>>;
  /** Tapping a tile — e.g. Zone/Tamper go to Zone Details, the rest jump to
   *  the Events tab pre-filtered to that subsystem's category. */
  onPressTile?: (key: SubsystemKey) => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const rows = Array.from(
    { length: Math.ceil(SUBSYSTEMS.length / COLUMNS) },
    (_, row) => SUBSYSTEMS.slice(row * COLUMNS, row * COLUMNS + COLUMNS),
  );

  const zoneStatus = statuses?.zone ?? 'success';

  return (
    <View
      style={[
        styles.card,
        {
          padding: spacing.lg,
          gap: spacing.md,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Typography
          variant="captionBold"
          size={14}
          align="left"
          color={colors.primary}
        >
          {t('main.system.title')}
        </Typography>

        {zoneStatus !== 'success' && (
          <StatusChip status={zoneStatus} label={t(`main.system.zoneChip.${zoneStatus}`)} />
        )}
      </View>

      <View style={{ gap: spacing.sm }}>
        {rows.map((row, index) => (
          <View key={index} style={[styles.row, { gap: spacing.sm }]}>
            {row.map(item => (
              <StatusTile
                key={item.key}
                label={t(`main.system.${item.key}`)}
                glyph={item.glyph}
                status={statuses?.[item.key] ?? 'success'}
                onPress={onPressTile ? () => onPressTile(item.key) : undefined}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    boxShadow:
      '0px 2px 10px 0px #0000000A, 0px 14px 28px -10px #00000012',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});
