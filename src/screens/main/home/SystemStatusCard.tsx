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
import type { ZoneCodeChip } from './useMainStatus';

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
  /** False for a display-only tile — it ignores `onPressTile`. */
  pressable?: boolean;
}[] = [
  { key: 'zone', glyph: ZoneGlyph },
  { key: 'battery', glyph: BatteryGlyph },
  { key: 'ac', glyph: AcGlyph },
  { key: 'hooter', glyph: HooterGlyph },
  { key: 'tamper', glyph: TamperGlyph },
  // Signal has no detail page or event category to open, so it only shows status.
  { key: 'signal', glyph: SignalGlyph, pressable: false },
];

/** Three per row, two rows. */
const COLUMNS = 3;

export function SystemStatusCard({
  statuses,
  zoneChips = [],
  onPressTile,
}: {
  /** Status per subsystem; anything missing is treated as healthy */
  statuses?: Partial<Record<SubsystemKey, SubsystemStatus>>;
  /** One chip per zone code active right now (Delay, Alarm, Bypass, …) */
  zoneChips?: ZoneCodeChip[];
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

        {zoneChips.length > 0 && (
          <View style={[styles.chips, { gap: spacing.xs }]}>
            {zoneChips.map(chip => (
              <StatusChip
                key={chip.code}
                status={chip.status}
                label={t(`main.zoneStatus.codes.${chip.labelKey}`)}
              />
            ))}
          </View>
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
                onPress={
                  onPressTile && item.pressable !== false
                    ? () => onPressTile(item.key)
                    : undefined
                }
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
    boxShadow: '0px 2px 10px 0px #0000000A, 0px 14px 28px -10px #00000012',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chips: {
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});
