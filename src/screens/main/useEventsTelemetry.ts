import { useEffect, useState } from 'react';

import { COGNITO, TELEMETRY_TABLE } from '../../config/awsConfig';
import { getCredentials } from '../../session/cognito';
import { useSession } from '../../session/SessionProvider';
import { queryTelemetry, type TelemetryRow } from '../../utils/dynamoDb';
import { resolveThingName } from '../../utils/thingName';

const log = (...args: any[]) => console.log('[Events]', ...args);
const logWarn = (...args: any[]) => console.warn('[Events]', ...args);

/** How many of the most recent rows to pull in one query. */
const PAGE_SIZE = 50;

/**
 * Diagnostic-only: fetches the device's event/telemetry history from
 * `dtx_tngrama_telemetry` and logs the raw rows to the console, tagged
 * `[Events]`, so the actual row shape can be inspected before any UI gets
 * built on top of it. Nothing renders this data yet.
 */
export function useEventsTelemetry() {
  const { session, getFreshIdToken } = useSession();
  const [rows, setRows] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const thingName = resolveThingName(session?.thingName);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        log('FETCH start — table', TELEMETRY_TABLE, 'thing', thingName);
        const idToken = await getFreshIdToken();
        const { credentials } = await getCredentials(COGNITO, idToken);
        const result = await queryTelemetry({
          region: COGNITO.region,
          table: TELEMETRY_TABLE,
          thingName,
          creds: credentials,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        log('FETCH OK —', result.length, 'row(s)');
        log('RAW ROWS →', JSON.stringify(result, null, 2));
        setRows(result);
      } catch (e: any) {
        if (cancelled) return;
        logWarn('FETCH FAILED:', e?.message);
        setError(e?.message ?? 'Failed to load events.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [session?.thingName, getFreshIdToken]);

  return { rows, loading, error };
}
