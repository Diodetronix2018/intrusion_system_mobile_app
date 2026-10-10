import React from 'react';

import { Icon } from '../../../components';
import {
  BellIcon,
  LocationPinIcon,
  LockIcon,
  MoonIcon,
  PlugIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  UnlockIcon,
  Volume2Icon,
} from '../../../icons';
import type { IconProps } from '../../../icons';
import BatteryIcon from '../../../icons/svg/battery.svg';
import BatteryAlertIcon from '../../../icons/svg/battery-alert.svg';
import ChargeFailIcon from '../../../icons/svg/charge-fail.svg';
import type { TelemetryRow } from '../../../utils/dynamoDb';
import type { EventCategoryId } from './eventCategories';

/** Drives the icon-ring/title colour on the card — no fail/normal concept for "neutral". */
export type EventStatus = 'success' | 'warning' | 'caution' | 'failed' | 'neutral';

/** One icon + value pair shown on a card (e.g. zone mode, location). */
export interface EventDetail {
  icon: React.ComponentType<IconProps>;
  label: string;
}

/** A small tinted status pill — icon and label in its own status colour. */
export interface EventChip {
  label: string;
  status: EventStatus;
  icon: React.ComponentType<IconProps>;
}

export interface EventItem {
  id: string;
  category: EventCategoryId;
  title: string;
  /** Status pills on their own line under the title (e.g. ON/OFF + zone code). */
  chips?: EventChip[];
  /** Short detail pinned to the right end of the title line (e.g. zone mode). */
  titleDetail?: EventDetail;
  /** Detail after the timestamp — the one that truncates on a narrow screen. */
  metaDetail?: EventDetail;
  status: EventStatus;
  icon: React.ComponentType<IconProps>;
  timestamp: number;
  /** `"YYYY-MM-DD HH:mm:ss"`, device-local. */
  datetime?: string;
}

/** Index of the tamper line in `zon`/`zen`/`zmd`/`zloc` — zones 1-8 come before it. */
const TAMPER_INDEX = 8;

type T = (key: string, params?: Record<string, unknown>) => string;

const asNumber = (value: unknown): number =>
  typeof value === 'number' ? value : Number(value) || 0;

const asDatetime = (row: TelemetryRow): string | undefined =>
  typeof row.datetime === 'string' ? row.datetime : undefined;

/** Trims the device's padded text and treats its "Empty" placeholder as unset. */
function zoneLocation(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed && trimmed.toLowerCase() !== 'empty' ? trimmed : undefined;
}

// battery.svg / battery-alert.svg / charge-fail.svg are embedded rasters
// baked to a fixed colour, not `currentColor`, so their glyph ignores the
// ring's status tint. battery.svg / battery-alert.svg's body was recoloured
// to #000055 (navy) for this screen only — battery-alert.svg's orange
// triangle and charge-fail.svg's orange glyph are untouched.
const ChargeNormalIcon = ({ size, color }: IconProps) => (
  <Icon family="material" name="battery-charging-outline" size={size} color={color} />
);
const BatteryNormalIcon = ({ size }: IconProps) => (
  <BatteryIcon width={size} height={size} />
);
const BatteryFailIcon = ({ size }: IconProps) => (
  <BatteryAlertIcon width={size} height={size} />
);
const ChargeFailGlyph = ({ size }: IconProps) => (
  <ChargeFailIcon width={size} height={size} />
);
/** Zone mode "Always" — the same `time-outline` glyph the Zone tab uses. */
const AlwaysIcon = ({ size, color }: IconProps) => (
  <Icon name="time-outline" size={size} color={color} />
);

/** Wraps an Ionicons glyph in the `{ size, color }` icon props. */
const ionicon = (name: string) =>
  function IonGlyph({ size, color }: IconProps) {
    return <Icon name={name} size={size} color={color} />;
  };

const PowerIcon = ionicon('power');
const FireIcon = ionicon('flame');

/**
 * A zone's `zon[i]` code -> its chip: the label key, tint and icon. Codes
 * the panel hasn't defined (5, or anything unknown) get no chip.
 */
const ZONE_CODE_CHIPS: Record<
  number,
  { labelKey: string; status: EventStatus; icon: React.ComponentType<IconProps> }
> = {
  0: { labelKey: 'main.zoneStatus.codes.normal', status: 'success', icon: ionicon('checkmark-circle') },
  1: { labelKey: 'main.zoneStatus.warning', status: 'warning', icon: ionicon('hourglass-outline') },
  2: { labelKey: 'main.zoneStatus.codes.alarm', status: 'failed', icon: BellIcon },
  3: { labelKey: 'main.zoneStatus.codes.bypass', status: 'warning', icon: ionicon('play-skip-forward') },
  4: { labelKey: 'main.zoneStatus.codes.warning', status: 'caution', icon: ionicon('warning-outline') },
  6: { labelKey: 'main.zoneStatus.codes.isolate', status: 'caution', icon: ionicon('remove-circle-outline') },
  7: { labelKey: 'main.zoneStatus.codes.fire', status: 'failed', icon: FireIcon },
};

function buildModeEvent(row: TelemetryRow, id: string, t: T): EventItem[] {
  const away = row.status === 1;
  return [
    {
      id,
      category: 'mode',
      title: t(away ? 'events.mode.away' : 'events.mode.stay'),
      status: 'neutral',
      icon: away ? UnlockIcon : LockIcon,
      timestamp: asNumber(row.timestamp),
      datetime: asDatetime(row),
    },
  ];
}

function buildPowerFailEvents(row: TelemetryRow, id: string, t: T): EventItem[] {
  const timestamp = asNumber(row.timestamp);
  const datetime = asDatetime(row);
  const acFail = asNumber(row.ac_fail) === 1;
  const chgFail = asNumber(row.chg_fail) === 1;

  return [
    {
      id: `${id}-ac`,
      category: 'powerFail',
      title: t(acFail ? 'events.power.acFail' : 'events.power.acNormal'),
      status: acFail ? 'warning' : 'success',
      icon: PlugIcon,
      timestamp,
      datetime,
    },
    {
      id: `${id}-chg`,
      category: 'powerFail',
      title: t(chgFail ? 'events.power.chargeFail' : 'events.power.chargeNormal'),
      status: chgFail ? 'warning' : 'success',
      icon: chgFail ? ChargeFailGlyph : ChargeNormalIcon,
      timestamp,
      datetime,
    },
  ];
}

/**
 * `battery` rows cover two events, told apart by `trigger`: `"bat_low"` is
 * always a Low Battery event (whatever `bat_low` holds), anything else is
 * battery fail/normal from `bat_fail`.
 */
function buildBatteryEvents(row: TelemetryRow, id: string, t: T): EventItem[] {
  if (row.trigger === 'bat_low') {
    return [
      {
        id,
        category: 'battery',
        title: t('events.battery.low'),
        status: 'warning',
        icon: BatteryFailIcon,
        timestamp: asNumber(row.timestamp),
        datetime: asDatetime(row),
      },
    ];
  }

  const fail = asNumber(row.bat_fail) === 1;
  return [
    {
      id,
      category: 'battery',
      title: t(fail ? 'events.battery.fail' : 'events.battery.normal'),
      status: fail ? 'warning' : 'success',
      icon: fail ? BatteryFailIcon : BatteryNormalIcon,
      timestamp: asNumber(row.timestamp),
      datetime: asDatetime(row),
    },
  ];
}

function buildHooterFailEvents(row: TelemetryRow, id: string, t: T): EventItem[] {
  const fail = asNumber(row.hooter_fail) === 1;
  return [
    {
      id,
      category: 'hooterFail',
      title: t(fail ? 'events.hooter.fail' : 'events.hooter.normal'),
      status: fail ? 'warning' : 'success',
      icon: Volume2Icon,
      timestamp: asNumber(row.timestamp),
      datetime: asDatetime(row),
    },
  ];
}

function buildHeartBeatEvent(row: TelemetryRow, id: string, t: T): EventItem[] {
  // Placeholder until its own status logic is given — one neutral card.
  return [
    {
      id,
      category: 'heartBeat',
      title: t('events.categories.heartBeat'),
      status: 'neutral',
      icon: ({ size, color }: IconProps) => (
        <Icon name="pulse-outline" size={size} color={color} />
      ),
      timestamp: asNumber(row.timestamp),
      datetime: asDatetime(row),
    },
  ];
}

/**
 * The zone index a row is about, from its `trigger` — whichever field changed
 * (`zon`, `zen`, `zmd`, `zloc`, …) with a single index, e.g. `"zloc[0]"` -> 0,
 * `"zmd[2]"` -> 2. A trigger listing several indices (`"zon[0,1,2,3]"`) isn't
 * about one zone, so it yields undefined and the row is dropped.
 */
function triggerZoneIndex(trigger: unknown): number | undefined {
  if (typeof trigger !== 'string') return undefined;
  const match = /^\s*\w+\[\s*(\d+)\s*\]\s*$/.exec(trigger);
  return match ? Number(match[1]) : undefined;
}

/**
 * One card for the single zone the row's `trigger` names (e.g. `zloc[i]`):
 *   - chips: ON/OFF from `zen[i]` (1 on — green, 0 off — red), then the
 *     zone's condition from `zon[i]` (Normal, Entry/Exit Delay, Alarm, …,
 *     see `ZONE_CODE_CHIPS`), each in its own colour;
 *   - mode (`zmd[i]`: 0 Night, 1 Always) at the end of the title line and
 *     location (`zloc[i]`) after the timestamp, with the Zone tab's icons.
 * An Alarm or Fire code takes over the card's main icon (red 🔔 / 🔥);
 * otherwise it's the ON/OFF shield. Index 8 is the tamper line, labelled as
 * such rather than "Zone 9". A row whose trigger names no zone is dropped.
 */
function buildZoneStatusEvent(row: TelemetryRow, id: string, t: T): EventItem[] {
  const index = triggerZoneIndex(row.trigger);
  if (index == null || index > TAMPER_INDEX) return [];

  const zen = Array.isArray(row.zen) ? row.zen : [];
  const zon = Array.isArray(row.zon) ? row.zon : [];
  const zmd = Array.isArray(row.zmd) ? row.zmd : [];
  const zloc = Array.isArray(row.zloc) ? row.zloc : [];

  const on = asNumber(zen[index]) === 1;
  const always = asNumber(zmd[index]) === 1;
  const code = zon[index] == null ? undefined : ZONE_CODE_CHIPS[asNumber(zon[index])];
  const critical = code?.status === 'failed';

  const chips: EventChip[] = [
    {
      label: t(on ? 'common.on' : 'common.off'),
      status: on ? 'success' : 'failed',
      icon: PowerIcon,
    },
  ];
  if (code) {
    chips.push({ label: t(code.labelKey), status: code.status, icon: code.icon });
  }

  return [
    {
      id: `${id}-zone${index}`,
      category: 'zoneStatus',
      title:
        index === TAMPER_INDEX
          ? t('main.system.tamper')
          : t('zone.label', { number: index + 1 }),
      chips,
      titleDetail:
        zmd[index] == null
          ? undefined
          : {
              icon: always ? AlwaysIcon : MoonIcon,
              label: t(always ? 'zone.always' : 'zone.night'),
            },
      metaDetail: {
        icon: LocationPinIcon,
        label: zoneLocation(zloc[index]) ?? t('zone.notConfigured'),
      },
      status: critical ? 'failed' : on ? 'success' : 'failed',
      icon: critical ? code.icon : on ? ShieldCheckIcon : ShieldXIcon,
      timestamp: asNumber(row.timestamp),
      datetime: asDatetime(row),
    },
  ];
}

/**
 * Expands one telemetry row into the events it actually represents — zero
 * (an unhandled/placeholder category), one, or several (Power Fail always
 * splits into an AC card + a Charge card).
 */
export function buildEventItems(
  row: TelemetryRow,
  rowIndex: number,
  category: EventCategoryId,
  t: T,
): EventItem[] {
  const id = `${asNumber(row.timestamp)}-${rowIndex}`;

  switch (category) {
    case 'mode':
      return buildModeEvent(row, id, t);
    case 'powerFail':
      return buildPowerFailEvents(row, id, t);
    case 'battery':
      return buildBatteryEvents(row, id, t);
    case 'hooterFail':
      return buildHooterFailEvents(row, id, t);
    case 'heartBeat':
      return buildHeartBeatEvent(row, id, t);
    case 'zoneStatus':
      return buildZoneStatusEvent(row, id, t);
    default:
      return [];
  }
}
