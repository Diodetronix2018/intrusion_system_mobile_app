/**
 * The categories the Events tab filters by. Each maps 1:1 to one of the
 * device's `trigger_type` values (see `categoryFromTriggerType`) — anything
 * else the device sends (`info`, `signal`, `initial`, …) isn't a real event
 * and is dropped before it ever reaches the UI, even under "All".
 *
 * Zone mode / zone location are commented out for now — pending their own
 * per-event status logic — rather than deleted (zone status is live; each of
 * its cards already shows the zone's mode and location too). To bring one
 * back: add it to this union, to `EVENT_CATEGORIES` below, to
 * `TRIGGER_TYPE_TO_CATEGORY`, give it a case in `buildEventItems.tsx`, and
 * uncomment its `events.categories.*` copy (already left in place in every
 * locale file).
 */
export type EventCategoryId =
  | 'mode'
  | 'powerFail'
  | 'battery'
  | 'hooterFail'
  | 'heartBeat'
  | 'zoneStatus';
// | 'zoneMode'
// | 'zoneLocation';

/** Filter chip order, left to right (after "All"). */
export const EVENT_CATEGORIES: EventCategoryId[] = [
  'zoneStatus',
  'mode',
  'powerFail',
  'battery',
  'hooterFail',
  'heartBeat',
  // 'zoneMode',
  // 'zoneLocation',
];

/** The device's `trigger_type` string -> the category it belongs to. */
const TRIGGER_TYPE_TO_CATEGORY: Record<string, EventCategoryId> = {
  'user control': 'mode',
  power: 'powerFail',
  battery: 'battery',
  fault: 'hooterFail',
  heartbeat: 'heartBeat',
  'zone on off status': 'zoneStatus',
  // 'zone mode change': 'zoneMode',
  // 'zone location': 'zoneLocation',
};

/** Returns the category for a raw `trigger_type`, or undefined to drop the row entirely. */
export function categoryFromTriggerType(triggerType: unknown): EventCategoryId | undefined {
  return typeof triggerType === 'string' ? TRIGGER_TYPE_TO_CATEGORY[triggerType] : undefined;
}
