import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { buildEventItems, type EventItem } from './buildEventItems';
import { categoryFromTriggerType, type EventCategoryId } from './eventCategories';
import { useEventsTelemetry } from './useEventsTelemetry';

export type EventFilter = 'all' | EventCategoryId;

/** How many events to show at once, after filtering. */
const MAX_VISIBLE = 10;

export type { EventItem };

/**
 * Loads the device's event history (`useEventsTelemetry`), drops any row
 * whose `trigger_type` isn't one of the known categories (the device also
 * sends `info`/`signal`/`initial`/… rows that aren't real events), expands
 * each remaining row into its actual event card(s) (`buildEventItems` — a
 * single row can produce several, e.g. one per zone in alarm), and applies
 * the active category filter plus a text search over each card's own
 * title/subtitle — capping the result to the 10 most recent.
 *
 * `initialFilter` seeds the category chip (e.g. arriving from the Main
 * screen's Hooter tile with `hooterFail` preselected) — only read once, on
 * mount; see `EventsScreen` for how a later navigation while already
 * mounted re-applies it.
 */
export function useEvents(initialFilter?: EventFilter) {
  const { t } = useTranslation();
  const { rows, loading, error } = useEventsTelemetry();
  const [filter, setFilter] = useState<EventFilter>(initialFilter ?? 'all');
  const [query, setQuery] = useState('');

  const items = useMemo<EventItem[]>(() => {
    const built = rows.flatMap((row, index) => {
      const category = categoryFromTriggerType(row.trigger_type);
      if (!category) return [];
      return buildEventItems(row, index, category, t);
    });

    // Newest first, regardless of the order the table returned them in.
    return built.sort((a, b) => b.timestamp - a.timestamp);
  }, [rows, t]);

  const events = useMemo(() => {
    let list = filter === 'all' ? items : items.filter(item => item.category === filter);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          (item.subtitle ?? '').toLowerCase().includes(q) ||
          (item.datetime ?? '').toLowerCase().includes(q),
      );
    }

    return list.slice(0, MAX_VISIBLE);
  }, [items, filter, query]);

  return { events, filter, setFilter, query, setQuery, loading, error };
}
