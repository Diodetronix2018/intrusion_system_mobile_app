import React from 'react';

import { Icon } from '../../../components';
import {
  AlertTriangleIcon,
  LockIcon,
  PlugIcon,
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
export type EventStatus = 'success' | 'warning' | 'failed' | 'neutral';

export interface EventItem {
  id: string;
  category: EventCategoryId;
  title: string;
  /** e.g. the zone's location name, for Alarm. */
  subtitle?: string;
  status: EventStatus;
  icon: React.ComponentType<IconProps>;
  timestamp: number;
  /** `"YYYY-MM-DD HH:mm:ss"`, device-local. */
  datetime?: string;
}

/** Zones 1-8 only — `zon`'s 9th entry (index 8) is the tamper line, not a zone. */
const ALARM_ZONE_COUNT = 8;

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

function buildBatteryEvents(row: TelemetryRow, id: string, t: T): EventItem[] {
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
 * One card per zone (1-8) that's actually in alarm (`zon[i] === 2`) — a
 * single row can alarm on several zones at once, so this can return
 * anywhere from zero to `ALARM_ZONE_COUNT` cards, all sharing the row's
 * timestamp.
 */
function buildAlarmEvents(row: TelemetryRow, id: string, t: T): EventItem[] {
  const zon = Array.isArray(row.zon) ? row.zon : [];
  const zloc = Array.isArray(row.zloc) ? row.zloc : [];
  const timestamp = asNumber(row.timestamp);
  const datetime = asDatetime(row);

  const items: EventItem[] = [];
  for (let i = 0; i < ALARM_ZONE_COUNT; i++) {
    if (asNumber(zon[i]) !== 2) continue;
    items.push({
      id: `${id}-zone${i}`,
      category: 'alarm',
      title: t('events.alarm.zoneTitle', { number: i + 1 }),
      subtitle: zoneLocation(zloc[i]) ?? t('zone.notConfigured'),
      status: 'failed',
      icon: AlertTriangleIcon,
      timestamp,
      datetime,
    });
  }
  return items;
}

/**
 * Expands one telemetry row into the events it actually represents — zero
 * (an unhandled/placeholder category), one, or several (Power Fail always
 * splits into an AC card + a Charge card; Alarm splits into one card per
 * zone currently alarming).
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
    case 'alarm':
      return buildAlarmEvents(row, id, t);
    default:
      return [];
  }
}
