import { useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

import { COGNITO, IOT_ENDPOINT, IOT_POLICY_NAME } from '../config/awsConfig';
import { getCredentials } from '../session/cognito';
import { useSession } from '../session/SessionProvider';
import { attachIotPolicy, namedShadowTopics, presignIotWssUrl } from './awsIot';
import { createRNWebSocketStreamBuilder } from './mqttWsStream';
import { resolveThingName } from './thingName';

const log = (...args: any[]) => console.log('[IoT subscribe]', ...args);
const logWarn = (...args: any[]) => console.warn('[IoT subscribe]', ...args);

export type ShadowConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

/**
 * Keeps a live MQTT-over-WebSocket connection subscribed to a named
 * shadow's `update/accepted` topic and returns the most recent
 * `state.reported` document the device has pushed — e.g. the Main screen's
 * live status tiles reading `sba_control_v01`'s reported telemetry.
 *
 * Also fetches the shadow's *current* state once on connect (publishing an
 * empty payload to `.../get` and reading the `.../get/accepted` reply), so
 * the tiles populate immediately instead of waiting for the device's next
 * periodic push — same as the sibling 3-phase app's `IotProvider` does for
 * its control shadow.
 *
 * Unlike `useIotShadowPublish` (one-shot, closes as soon as the publish is
 * acked), this connection stays open for as long as the calling component
 * is mounted, with mqtt.js auto-reconnecting on drops so the tiles keep
 * refreshing as the device's periodic reports arrive.
 */
export function useShadowSubscription<T = Record<string, unknown>>(
  shadowName: string,
) {
  const { session, getFreshIdToken } = useSession();
  const [reported, setReported] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<ShadowConnectionStatus>('connecting');
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    const thingName = resolveThingName(session?.thingName);
    const topics = namedShadowTopics(thingName, shadowName);

    setStatus('connecting');
    log('CONNECT flow start — thing', thingName, 'shadow', shadowName);

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
          // Must match the reference app's `identityId` exactly (no
          // suffix) — the attached IoT policy's `iot:Connect` resource is
          // scoped to `client/${cognito-identity.amazonaws.com:sub}`, so
          // any other clientId gets silently denied at the MQTT CONNECT
          // step (the WebSocket opens fine, but `connect` never fires and
          // mqtt.js just keeps retrying).
          //
          // NOTE: because of this, this connection and any concurrent
          // `useIotShadowPublish` one-shot connection race for the SAME
          // clientId — a publish will transiently evict this subscription
          // (AWS IoT allows only one live connection per clientId), which
          // then reconnects a few seconds later. That's expected; it isn't
          // a failure. Giving each connection its own clientId would avoid
          // the eviction, but requires loosening the policy's Connect
          // resource to a wildcard, e.g.
          // `client/${cognito-identity.amazonaws.com:sub}*`.
          clientId: identityId,
          clean: true,
          keepalive: 60,
          connectTimeout: 15000,
          // this connection is meant to stay up for the screen's lifetime,
          // unlike a one-shot publish — let mqtt.js reconnect on its own.
          reconnectPeriod: 5000,
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
          log('CONNECTED — thing', thingName, 'shadow', shadowName);
          setConnected(true);
          setStatus('connected');

          const subs = [topics.updateAccepted, topics.getAccepted, topics.getRejected];
          log('SUBSCRIBE →', subs);
          client.subscribe(subs, { qos: 0 }, (err?: Error | null, granted?: any) => {
            if (err) {
              logWarn('SUBSCRIBE FAILED:', err.message, subs);
              return;
            }
            log('SUBSCRIBE OK ←', granted?.map?.((g: any) => `${g.topic} (qos ${g.qos})`) ?? subs);

            // Fetch the shadow's current state right away, rather than
            // waiting for the device's next periodic push.
            log('GET → publishing {} to', topics.get);
            client.publish(topics.get, '{}', { qos: 0 }, (pubErr?: Error) => {
              if (pubErr) logWarn('GET FAILED (publish):', pubErr.message);
              else log('GET OK — awaiting', topics.getAccepted);
            });
          });
        });

        client.on('message', (msgTopic: string, payload: Buffer) => {
          const raw = payload.toString();

          if (msgTopic === topics.getRejected) {
            logWarn('GET REJECTED ←', raw);
            return;
          }
          if (msgTopic !== topics.updateAccepted && msgTopic !== topics.getAccepted) {
            return;
          }

          const kind = msgTopic === topics.getAccepted ? 'GET RESPONSE' : 'UPDATE ACCEPTED';
          log(`${kind} ← [${msgTopic}]`, raw);

          try {
            const doc = JSON.parse(raw);
            const nextReported = doc?.state?.reported;
            if (nextReported && typeof nextReported === 'object') {
              log(`${kind} — reported`, nextReported);
              setReported(nextReported as T);
            } else {
              logWarn(`${kind} — no state.reported in payload`);
            }
          } catch (e: any) {
            logWarn('message parse failed:', e?.message, raw);
          }
        });

        client.on('reconnect', () => {
          log('RECONNECTING…');
          setStatus('reconnecting');
        });
        client.on('close', () => {
          log('CLOSE — connection closed');
          setConnected(false);
          setStatus(prev => (prev === 'error' ? prev : 'disconnected'));
        });
        client.on('error', (err: Error) => {
          logWarn('CONNECTION ERROR:', err.message);
          setConnected(false);
          setStatus('error');
        });
      } catch (e: any) {
        logWarn('CONNECT flow failed:', e?.message);
        setStatus('error');
      }
    }

    connect();

    return () => {
      cancelled = true;
      log('DISCONNECT — ending client (unmount or thing/shadow change)');
      try {
        clientRef.current?.end(true);
      } catch {
        /* noop */
      }
      clientRef.current = null;
      setConnected(false);
    };
  }, [session?.thingName, shadowName, getFreshIdToken]);

  return { reported, connected, status };
}
