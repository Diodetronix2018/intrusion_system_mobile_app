import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FeatureCard, Icon, Screen, ScreenHeader, Typography } from '../../../components';
import { DoorOpenIcon, MoonIcon } from '../../../icons';
import type { IconProps } from '../../../icons';
import { useTheme } from '../../../theme';
import { useMainStatus } from './useMainStatus';
import type { MainZoneEntry } from './useMainStatus';
import type { ZoneCondition } from './ZoneStatusCard';

/** Ionicons `time-outline`, wrapped so it matches the SVG icons' `{ size, color }` props. */
const AlwaysIcon = ({ size, color }: IconProps) => (
  <Icon name="time-outline" size={size} color={color} />
);

/** Material `shield-alert-outline`, wrapped the same way — the tamper card's own glyph. */
const TamperIcon = ({ size, color }: IconProps) => (
  <Icon family="material" name="shield-alert-outline" size={size} color={color} />
);

function statusColor(colors: ReturnType<typeof useTheme>['colors'], status: ZoneCondition) {
  return status === 'fault'
    ? colors.failed
    : status === 'warning'
    ? colors.warning
    : colors.success;
}

/** One card per zone (1-8) plus the tamper line — nine total. */
function ZoneDetailsCard({ zone }: { zone: MainZoneEntry }) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  const tint = statusColor(colors, zone.status);
  const Glyph = zone.isTamper ? TamperIcon : DoorOpenIcon;
  const title = zone.isTamper
    ? t('partSetting.tamper')
    : `Z${String(zone.number).padStart(2, '0')}`;
  const location = zone.configured ? zone.location : t('zone.notConfigured');
  const ModeIcon = zone.mode === 'always' ? AlwaysIcon : MoonIcon;
  const modeLabel = zone.mode ? t(`zone.${zone.mode}`) : undefined;

  return (
    <FeatureCard
      shadow="soft"
      icon={<Glyph size={20} color={colors.onPrimary} />}
      title={title}
      titleTrailing={
        modeLabel && (
          <View
            style={[
              styles.modeBadge,
              {
                gap: spacing.xs / 2,
                borderRadius: radius.pill,
                backgroundColor: colors.backgroundSoft,
                paddingHorizontal: spacing.sm,
              },
              styles.modeBadgePadding,
            ]}
          >
            <ModeIcon size={12} color={colors.textSecondary} />
            <Typography variant="caption" size={11} color={colors.textSecondary} numberOfLines={1}>
              {modeLabel}
            </Typography>
          </View>
        )
      }
      description={location}
      trailing={
        <View
          style={[
            styles.statusPill,
            {
              borderRadius: radius.pill,
              backgroundColor: `${tint}1A`,
              paddingHorizontal: spacing.sm + 2,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: tint }]} />
          <Typography variant="captionBold" size={12} color={tint} numberOfLines={1}>
            {t(`main.zoneStatus.${zone.status}`)}
          </Typography>
        </View>
      }
    />
  );
}

export function ZoneDetailsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { zones } = useMainStatus();

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSoft }]}>
      <ScreenHeader
        title={t('main.zoneDetails.title')}
        background={colors.backgroundSoft}
      />

      <Screen
        edges={['left', 'right']}
        background={colors.backgroundSoft}
        contentContainerStyle={{ gap: spacing.md }}
      >
        {zones.map((zone, index) => (
          <ZoneDetailsCard key={index} zone={zone} />
        ))}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeBadgePadding: {
    paddingVertical: 2,
  },
});
