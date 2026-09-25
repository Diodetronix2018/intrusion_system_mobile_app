import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

import {
  COGNITO,
  IOT_ENDPOINT,
  IOT_POLICY_NAME,
  SBA_CONFIG_SHADOW,
  SBA_CONTROL_SHADOW,
} from '../config/awsConfig';
import { getCredentials } from '../session/cognito';
import { useSession } from '../session/SessionProvider';
import {
  attachIotPolicy,
  desiredStatePayload,
  namedShadowTopics,
  presignIotWssUrl,
} from './awsIot';
import { createRNWebSocketStreamBuilder } from './mqttWsStream';
import { resolveThingName } from './thingName';

const log = (...args: any[]) => console.log('[IoT]', ...args);
const logWarn = (...args: any[]) => console.warn('[IoT]', ...args);

export type IotConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

/** Give up if the broker hasn't acked a publish within this long. */
const PUBLISH_TIMEOUT_MS = 15000;

/**
 * Wait this long after a publish ack before re-fetching the shadow. The ack
 * only confirms the *desired* state reached AWS IoT — the panel still has to
 * notice the delta, apply it, and publish its own `reported` update before a
 * `get` reflects the change; firing the `get` immediately just re-reads the
 * still-stale `reported` state sitting next to the new `desired` one.
 */
const POST_PUBLISH_GET_DELAY_MS = 2000;

/**
 * Back-off between automatic reconnects after a drop or a failed connect:
 * the n-th consecutive retry waits `RETRY_DELAYS_MS[n]`, then the last value
 * repeats. Reset to the start once a connection succeeds.
 */
const RETRY_DELAYS_MS = [2000, 5000, 10000, 20000, 30000];

/**
 * A publish made while the connection is down kicks off a reconnect and
 * waits up to this long for it before failing, so a command tapped just as
 * the socket dropped still goes through instead of erroring immediately.
 */
const CONNECT_WAIT_MS = 10000;

interface IotConnectionValue {
  /** `sba_control_v01`'s most recent reported document. */
  controlReported: Record<string, unknown> | null;
  /** `sba_config_v01`'s most recent reported document. */
  configReported: Record<string, unknown> | null;
  connected: boolean;
  status: IotConnectionStatus;
  /**
   * Publishes desired state to a named shadow over the one shared connection.
   * If the connection is down it reconnects first, waiting up to
   * `CONNECT_WAIT_MS` before giving up.
   */
  publish: (shadowName: string, desired: Record<string, unknown>) => Promise<void>;
  /**
   * Drops whatever connection there is and runs the whole connect flow again
   * right away (fresh token, credentials and presigned URL). A no-op while an
   * attempt is already in flight.
   */
  reconnect: () => void;
}

const IotConnectionContext = createContext<IotConnectionValue | undefined>(undefined);

/**
 * The app's one and only MQTT connection, for its entire signed-in
 * lifetime: subscribed to both the control (`sba_control_v01`) and config
 * (`sba_config_v01`) shadows' `update/accepted` and `get/accepted` topics,
 * and reused for every publish too (`useIotShadowPublish` calls `publish`
 * here instead of opening a connection of its own).
 *
 * AWS IoT allows only one live connection per clientId, and ours is the
 * bare Cognito identity id (the attached IoT policy's `iot:Connect`
 * resource requires an exact match — see `useIotShadowPublish`'s history).
 * Earlier this app opened a separate connection per subscription *and* per
 * publish, all with that same clientId — each new one silently evicted
 * whichever was already live, producing an endless connect → evict →
 * reconnect loop. Keeping everything on a single client, the same way the
 * sibling 3-phase app's `IotProvider` does, is what keeps the connection
 * stable and makes commands land immediately instead of each one paying
 * for its own connect-credentials-subscribe round trip.
 *
 * Reconnecting always re-runs the *whole* flow rather than letting mqtt.js
 * redial on its own: the presigned URL carries temporary Cognito
 * credentials that expire (about an hour), so mqtt.js's built-in reconnect —
 * which reuses the one URL it was given — keeps failing once they have,
 * leaving the app stuck offline until it's restarted. Drops retry on a
 * back-off (`RETRY_DELAYS_MS`), and coming back to the foreground reconnects
 * immediately.
 */
export function IotConnectionProvider({ children }: { children: React.ReactNode }) {
  const { session, getFreshIdToken } = useSession();
  const [controlReported, setControlReported] = useState<Record<string, unknown> | null>(null);
  const [configReported, setConfigReported] = useState<Record<string, unknown> | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<IotConnectionStatus>('connecting');
  const clientRef = useRef<MqttClient | null>(null);
  // Bumped to tear the current client down and run the connect flow again.
  const [generation, setGeneration] = useState(0);
  // True from the start of a connect flow until it connects or fails.
  const inFlightRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  /** Queues the next automatic reconnect, unless one is already queued. */
  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current) return;
    // Timers don't run reliably in the background; the foreground handler
    // below reconnects as soon as the app is back instead.
    if (AppState.currentState !== 'active') {
      log('RETRY deferred — app in background, will reconnect on foreground');
      return;
    }
    const delay =
      RETRY_DELAYS_MS[Math.min(retryCountRef.current, RETRY_DELAYS_MS.length - 1)];
    retryCountRef.current += 1;
    log('RETRY scheduled in', delay, 'ms (attempt', retryCountRef.current, ')');
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      setGeneration(g => g + 1);
    }, delay);
  }, []);

  const reconnect = useCallback(() => {
    if (inFlightRef.current) return;
    log('RECONNECT requested');
    clearRetry();
    retryCountRef.current = 0;
    setGeneration(g => g + 1);
  }, [clearRetry]);

  // Sockets are routinely killed while the app is in the background; come
  // back to the foreground connected rather than waiting for a retry.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && !clientRef.current?.connected) {
        reconnect();
      }
    });
    return () => sub.remove();
  }, [reconnect]);

  useEffect(() => {
    let cancelled = false;
    const thingName = resolveThingName(session?.activeThingName);
    const controlTopics = namedShadowTopics(thingName, SBA_CONTROL_SHADOW);
    const configTopics = namedShadowTopics(thingName, SBA_CONFIG_SHADOW);

    inFlightRef.current = true;
    setStatus(generation === 0 ? 'connecting' : 'reconnecting');
    log('CONNECT flow start — thing', thingName, '(generation', generation, ')');

    async function connect() {
      try {
        const idToken = await getFreshIdToken();
        if (cancelled) return;
        const { identityId, credentials } = await getCredentials(COGNITO, idToken);
        if (cancelled) return;
        log('CREDENTIALS ok — identityId', identityId);

        try {
          await attachIotPolicy(COGNITO.region, IOT_POLICY_NAME, identityId, credentials);
          log('POLICY attached —', IOT_POLICY_NAME);
        } catch (e: any) {
          logWarn('attachPolicy warning (continuing):', e?.message);
        }
        if (cancelled) return;

        const url = presignIotWssUrl(COGNITO.region, IOT_ENDPOINT, credentials);
        const streamBuilder = createRNWebSocketStreamBuilder(url);
        const client = new mqtt.MqttClient(streamBuilder, {
          // Must be exactly the identity id — see the module doc comment.
          clientId: identityId,
          clean: true,
          keepalive: 60,
          connectTimeout: 15000,
          // Reconnects are handled above by re-running this whole flow —
          // mqtt.js would redial with this same presigned URL, which stops
          // working once its credentials expire.
          reconnectPeriod: 0,
          protocolVersion: 4,
        });

        if (cancelled) {
          try {
            client.end(true);
          } catch {
            /* noop */
          }
          return;
        }
        clientRef.current = client;

        client.on('connect', () => {
          if (cancelled) return;
          log('CONNECTED — thing', thingName);
          inFlightRef.current = false;
          retryCountRef.current = 0;
          clearRetry();
          setConnected(true);
          setStatus('connected');

          const subs = [
            controlTopics.updateAccepted,
            controlTopics.getAccepted,
            controlTopics.getRejected,
            configTopics.updateAccepted,
            configTopics.getAccepted,
            configTopics.getRejected,
          ];
          log('SUBSCRIBE →', subs);
          client.subscribe(subs, { qos: 0 }, (err?: Error | null, granted?: any) => {
            if (err) {
              logWarn('SUBSCRIBE FAILED:', err.message, subs);
              return;
            }
            log(
              'SUBSCRIBE OK ←',
              granted?.map?.((g: any) => `${g.topic} (qos ${g.qos})`) ?? subs,
            );

            log('GET → publishing {} to', controlTopics.get);
            client.publish(controlTopics.get, '{}', { qos: 0 }, (pubErr?: Error) => {
              if (pubErr) logWarn('GET FAILED (control):', pubErr.message);
            });
            log('GET → publishing {} to', configTopics.get);
            client.publish(configTopics.get, '{}', { qos: 0 }, (pubErr?: Error) => {
              if (pubErr) logWarn('GET FAILED (config):', pubErr.message);
            });
          });
        });

        client.on('message', (msgTopic: string, payload: Buffer) => {
          const raw = payload.toString();

          if (msgTopic === controlTopics.getRejected) {
            logWarn('CONTROL GET REJECTED ←', raw);
            return;
          }
          if (msgTopic === configTopics.getRejected) {
            logWarn('CONFIG GET REJECTED ←', raw);
            return;
          }

          const isControl =
            msgTopic === controlTopics.updateAccepted || msgTopic === controlTopics.getAccepted;
          const isConfig =
            msgTopic === configTopics.updateAccepted || msgTopic === configTopics.getAccepted;
          if (!isControl && !isConfig) return;

          log(`${isControl ? 'CONTROL' : 'CONFIG'} ← [${msgTopic}]`, raw);
          try {
            const doc = JSON.parse(raw);
            const reported = doc?.state?.reported;
            if (reported && typeof reported === 'object') {
              // `update/accepted` only echoes whatever fields that specific
              // update touched — often just the one setting that changed,
              // not the whole document. Merging (not replacing) means an
              // unrelated screen's already-loaded fields survive a save
              // made from a different screen, instead of reverting to their
              // defaults. `get/accepted` is a full document and merges in
              // harmlessly the same way.
              if (isControl) setControlReported(prev => ({ ...prev, ...reported }));
              else setConfigReported(prev => ({ ...prev, ...reported }));
            }
          } catch (e: any) {
            logWarn('message parse failed:', e?.message, raw);
          }
        });

        // A client this effect has already torn down (`cancelled`) still
        // fires `close` as it ends — ignore it, a newer one owns the state.
        client.on('close', () => {
          if (cancelled) return;
          log('CLOSE — connection closed');
          inFlightRef.current = false;
          setConnected(false);
          setStatus(prev => (prev === 'error' ? prev : 'disconnected'));
          scheduleRetry();
        });
        client.on('error', (err: Error) => {
          if (cancelled) return;
          logWarn('CONNECTION ERROR:', err.message);
          inFlightRef.current = false;
          setConnected(false);
          setStatus('error');
          scheduleRetry();
        });
      } catch (e: any) {
        if (cancelled) return;
        logWarn('CONNECT flow failed:', e?.message);
        inFlightRef.current = false;
        setStatus('error');
        scheduleRetry();
      }
    }

    connect();

    return () => {
      cancelled = true;
      log('DISCONNECT — ending client (unmount)');
      try {
        clientRef.current?.end(true);
      } catch {
        /* noop */
      }
      clientRef.current = null;
      inFlightRef.current = false;
      clearRetry();
      setConnected(false);
    };
  }, [session?.activeThingName, getFreshIdToken, generation, clearRetry, scheduleRetry]);

  /**
   * The live client, reconnecting first if the connection is down — or null
   * if it still isn't back within `CONNECT_WAIT_MS`.
   */
  const waitForConnection = useCallback(async (): Promise<MqttClient | null> => {
    if (clientRef.current?.connected) return clientRef.current;
    log('PUBLISH waiting for connection…');
    reconnect();
    const deadline = Date.now() + CONNECT_WAIT_MS;
    while (Date.now() < deadline) {
      await new Promise<void>(resolve => setTimeout(resolve, 250));
      if (clientRef.current?.connected) return clientRef.current;
    }
    return null;
  }, [reconnect]);

  const publish = useCallback(
    async (shadowName: string, desired: Record<string, unknown>): Promise<void> => {
      const client = await waitForConnection();
      if (!client) {
        throw new Error(
          'Not connected to the device — check your internet connection and try again.',
        );
      }

      return new Promise((resolve, reject) => {
        const thingName = resolveThingName(session?.activeThingName);
        const topics = namedShadowTopics(thingName, shadowName);
        const payload = desiredStatePayload(desired);
        log('PUBLISH →', topics.update, payload);

        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          logWarn('PUBLISH timed out — no ack within', PUBLISH_TIMEOUT_MS, 'ms');
          // No ack from a socket that still claims to be open usually means
          // it's silently dead — start over rather than waiting on keepalive.
          if (clientRef.current === client) reconnect();
          reject(new Error('Timed out publishing to the device.'));
        }, PUBLISH_TIMEOUT_MS);

        client.publish(topics.update, payload, { qos: 1 }, (error?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (error) {
            logWarn('PUBLISH FAILED:', error.message);
            reject(error);
            return;
          }
          log('PUBLISH OK —', topics.update);
          // A fresh full shadow doc, so every screen reading this shadow —
          // not just the one that just saved — is back in sync, rather than
          // relying solely on whatever partial delta the device's own
          // follow-up report happens to contain. Delayed: right after the
          // ack, the shadow only has our new `desired` — `reported` hasn't
          // moved yet because the panel itself hasn't processed the delta,
          // so a `get` fired immediately would just re-read the stale value.
          setTimeout(() => {
            const activeClient = clientRef.current;
            if (!activeClient || !activeClient.connected) return;
            log(
              'GET → publishing {} to',
              topics.get,
              `(after ${POST_PUBLISH_GET_DELAY_MS}ms)`,
            );
            activeClient.publish(topics.get, '{}', { qos: 0 }, (getErr?: Error) => {
              if (getErr) logWarn('POST-PUBLISH GET FAILED:', getErr.message);
            });
          }, POST_PUBLISH_GET_DELAY_MS);
          resolve();
        });
      });
    },
    [session?.activeThingName, waitForConnection, reconnect],
  );

  const value = useMemo<IotConnectionValue>(
    () => ({ controlReported, configReported, connected, status, publish, reconnect }),
    [controlReported, configReported, connected, status, publish, reconnect],
  );

  return (
    <IotConnectionContext.Provider value={value}>{children}</IotConnectionContext.Provider>
  );
}

/** Reads the app's single shared MQTT connection. */
export function useIotConnection(): IotConnectionValue {
  const ctx = useContext(IotConnectionContext);
  if (!ctx) {
    throw new Error('useIotConnection must be used within an IotConnectionProvider');
  }
  return ctx;
}
