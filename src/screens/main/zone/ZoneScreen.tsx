import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  Icon,
  Input,
  NumberInput,
  Screen,
  SectionLabel,
  Slider,
  ToggleSwitch,
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
  DETECTION_COUNT_MAX,
  DETECTION_COUNT_MIN,
  LOCATION_MAX_LENGTH,
  LOCATION_MIN_LENGTH,
  WAIT_TIME_MAX,
  WAIT_TIME_MIN,
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

/** Same boxed row as `DelayRow`, but a switch on the right instead of a number field. */
function ToggleRow({
  theme,
  label,
  description,
  value,
  onChange,
}: {
  theme: Theme;
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
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
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <View style={styles.delayLabel}>
        <Typography
          variant="caption"
          size={14}
          align="left"
          color={colors.primary}
          numberOfLines={1}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          size={12}
          align="left"
          color={colors.textSecondary}
          style={styles.toggleDescription}
        >
          {description}
        </Typography>
      </View>

      <ToggleSwitch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Boxed row with a label on top and a full-width slider below — a slider
 *  needs the whole row's width to be usable, unlike the number/switch rows. */
function SliderRow({
  theme,
  label,
  range,
  min,
  max,
  value,
  onChange,
}: {
  theme: Theme;
  label: string;
  range: string;
  min: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
}) {
  const { colors, radius, spacing } = theme;
  return (
    <View
      style={[
        styles.delayBox,
        styles.sliderBox,
        {
          gap: spacing.xs,
          borderRadius: radius.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
      ]}
    >
      <Typography
        variant="caption"
        size={14}
        align="left"
        color={colors.primary}
        numberOfLines={1}
      >
        {`${label} ${range}`}
      </Typography>

      <Slider
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function ZoneScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing } = theme;
  const { index, config, previous, next, update, save, saving } = useZoneConfig();
  const [locationError, setLocationError] = useState<string | undefined>();

  // the third pair uses the icon as a radio indicator: whichever card is
  // selected shows the ticked circle, the other an empty one
  const radioIcon = (selected: boolean) =>
    selected ? CheckCircleIcon : CircleIcon;

  const delayRange = t('zone.delayRange', {
    min: DELAY_MIN,
    max: DELAY_MAX,
  });

  const detectionCountRange = t('zone.countRange', {
    min: DETECTION_COUNT_MIN,
    max: DETECTION_COUNT_MAX,
  });

  const handleSave = async () => {
    if (config.location.trim().length < LOCATION_MIN_LENGTH) {
      setLocationError(t('zone.locationRequired'));
      return;
    }
    setLocationError(undefined);

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
    <Screen
      edges={['left', 'right']}
      background={colors.background}
      contentContainerStyle={{ gap: spacing.md }}
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

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        <ToggleRow
          theme={theme}
          label={t('zone.smartCheck.title')}
          description={t('zone.smartCheck.description')}
          value={config.smartCheck}
          onChange={smartCheck => update({ smartCheck })}
        />

        {config.smartCheck && (
          <>
            <DelayRow
              theme={theme}
              label={t('zone.waitTime')}
              range={t('zone.delayRange', {
                min: WAIT_TIME_MIN,
                max: WAIT_TIME_MAX,
              })}
              value={config.waitTime}
              onChange={waitTime => update({ waitTime })}
              unit={t('common.seconds')}
            />
            <SliderRow
              theme={theme}
              label={t('zone.detectionCount')}
              range={detectionCountRange}
              min={DETECTION_COUNT_MIN}
              max={DETECTION_COUNT_MAX}
              value={config.detectionCount}
              onChange={detectionCount => update({ detectionCount })}
            />
          </>
        )}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <SectionLabel>{t('zone.locationEntry')}</SectionLabel>
        <Input
          value={config.location}
          onChangeText={location => {
            update({ location });
            setLocationError(undefined);
          }}
          placeholder={t('zone.locationPlaceholder')}
          leftIcon={<DoorOpenIcon size={20} color={colors.primary} />}
          accessibilityLabel={t('zone.locationEntry')}
          maxLength={LOCATION_MAX_LENGTH}
          error={locationError}
        />
      </View>

      {/* scrolls with the content: a pinned footer moves with the keyboard,
          which fights the delay fields on device */}
      <Button
        title={t('common.saveConfiguration')}
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={{ marginTop: spacing['2xl'] }}
      />
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
  toggleDescription: {
    marginTop: 2,
  },
  sliderBox: {
    minHeight: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
});
