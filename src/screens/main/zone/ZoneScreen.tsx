import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  Icon,
  NumberInput,
  Screen,
  SectionLabel,
  Typography,
} from '../../../components';
import {
  CheckCircleIcon,
  CircleIcon,
  DoorOpenIcon,
  IconProps,
  MoonIcon,
  ShieldCheckIcon,
  ShieldXIcon,
} from '../../../icons';
import { useTheme, type Theme } from '../../../theme';
import { ChoiceCard, ChoiceRow } from './ChoiceCard';
import { ZoneSelector } from './ZoneSelector';
import {
  DELAY_MAX,
  DELAY_MIN,
  ZONE_LOCATION_KEYS,
  useZoneConfig,
} from './useZoneConfig';

/** Ionicons `time-outline`, wrapped so it matches the SVG icons' props. */
const TimeIcon = ({ size, color }: IconProps) => (
  <Icon name="time-outline" size={size} color={color} />
);

/** Label on the left, seconds field on the right. Module scope for identity. */
function DelayRow({
  theme,
  label,
  range,
  value,
  onChange,
  unit,
}: {
  theme: Theme;
  label: string;
  /** Accepted range, shown after the label */
  range: string;
  value: number;
  onChange: (next: number) => void;
  unit: string;
}) {
  const { colors, radius, spacing } = theme;
  return (
    <View
      style={[
        styles.delayBox,
        {
          gap: spacing.md,
          borderRadius: radius.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
          paddingHorizontal: spacing.lg,
          // the field is 37pt tall, so 8pt either side lands the box on 53-54
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <Typography
        variant="caption"
        size={14}
        align="left"
        color={colors.primary}
        numberOfLines={2}
        style={styles.delayLabel}
      >
        {`${label} ${range}`}
      </Typography>

      <NumberInput
        value={value}
        onChange={onChange}
        min={DELAY_MIN}
        max={DELAY_MAX}
        unit={unit}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function ZoneScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, radius, spacing } = theme;
  const { index, config, previous, next, update } = useZoneConfig();

  // the third pair uses the icon as a radio indicator: whichever card is
  // selected shows the ticked circle, the other an empty one
  const radioIcon = (selected: boolean) =>
    selected ? CheckCircleIcon : CircleIcon;

  const delayRange = t('zone.delayRange', {
    min: DELAY_MIN,
    max: DELAY_MAX,
  });

  const handleSave = () => {
    // no panel API yet; confirm the action so the button is not a dead end
    Toast.show({ type: 'success', text1: t('common.configurationSaved') });
  };

  return (
    <Screen
      edges={['left', 'right']}
      background={colors.background}
      contentContainerStyle={{ gap: spacing.md }}
      footer={
        <Button title={t('common.saveConfiguration')} onPress={handleSave} />
      }
    >
      <ZoneSelector
        label={t('zone.label', { number: index + 1 })}
        onPrevious={previous}
        onNext={next}
      />

      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <ChoiceRow>
          <ChoiceCard
            icon={ShieldCheckIcon}
            label={t('common.on')}
            selected={config.state === 'on'}
            onPress={() => update({ state: 'on' })}
          />
          <ChoiceCard
            icon={ShieldXIcon}
            label={t('common.off')}
            selected={config.state === 'off'}
            onPress={() => update({ state: 'off' })}
          />
        </ChoiceRow>

        <ChoiceRow>
          <ChoiceCard
            icon={TimeIcon}
            label={t('zone.always')}
            selected={config.schedule === 'always'}
            onPress={() => update({ schedule: 'always' })}
          />
          <ChoiceCard
            icon={MoonIcon}
            label={t('zone.night')}
            selected={config.schedule === 'night'}
            onPress={() => update({ schedule: 'night' })}
          />
        </ChoiceRow>

        <ChoiceRow>
          <ChoiceCard
            icon={radioIcon(config.contact === 'nc')}
            label={t('zone.nc')}
            selected={config.contact === 'nc'}
            onPress={() => update({ contact: 'nc' })}
          />
          <ChoiceCard
            icon={radioIcon(config.contact === 'no')}
            label={t('zone.no')}
            selected={config.contact === 'no'}
            onPress={() => update({ contact: 'no' })}
          />
        </ChoiceRow>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <SectionLabel>{t('zone.delays')}</SectionLabel>
        <View style={{ gap: spacing.md }}>
          <DelayRow
            theme={theme}
            label={t('zone.exitDelay')}
            range={delayRange}
            value={config.exitDelay}
            onChange={exitDelay => update({ exitDelay })}
            unit={t('common.seconds')}
          />
          <DelayRow
            theme={theme}
            label={t('zone.entryDelay')}
            range={delayRange}
            value={config.entryDelay}
            onChange={entryDelay => update({ entryDelay })}
            unit={t('common.seconds')}
          />
        </View>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <SectionLabel>{t('zone.locationEntry')}</SectionLabel>
        <View
          style={[
            styles.locationCard,
            {
              gap: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.lg,
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <DoorOpenIcon size={20} color={colors.primary} />
          <Typography
            variant="captionBold"
            size={16}
            align="left"
            color={colors.primary}
            numberOfLines={1}
            style={styles.locationLabel}
          >
            {t(`zone.locations.${ZONE_LOCATION_KEYS[index]}`)}
          </Typography>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  delayBox: {
    minHeight: 54,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  delayLabel: {
    flex: 1,
    minWidth: 0,
  },
  locationCard: {
    minHeight: 56,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLabel: {
    flexShrink: 1,
  },
});
