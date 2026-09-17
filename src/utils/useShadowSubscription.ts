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

let subscribeClientSeq = 0;

/**
 * Keeps a live MQTT-over-WebSocket connection subscribed to a named
 * shadow's `update/accepted` topic and returns the most recent
 * `state.reported` document the device has pushed — e.g. the Main screen's
 * live status tiles reading `sba_control_v01`'s reported telemetry.
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
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    const thingName = resolveThingName(session?.thingName);
    const topic = namedShadowTopics(thingName, shadowName).updateAccepted;

    async function connect() {
      try {
        const idToken = await getFreshIdToken();
        if (cancelled) return;
        const { identityId, credentials } = await getCredentials(COGNITO, idToken);
        if (cancelled) return;

        try {
          await attachIotPolicy(COGNITO.region, IOT_POLICY_NAME, identityId, credentials);
        } catch (e: any) {
          logWarn('attachPolicy warning (continuing):', e?.message);
        }
        if (cancelled) return;

        const url = presignIotWssUrl(COGNITO.region, IOT_ENDPOINT, credentials);
        const streamBuilder = createRNWebSocketStreamBuilder(url);
        const client = new mqtt.MqttClient(streamBuilder, {
          clientId: `${identityId}-sub-${++subscribeClientSeq}`,
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
          log('CONNECTED — subscribing to', topic);
          setConnected(true);
          client.subscribe(topic, { qos: 0 }, (err?: Error | null) => {
            if (err) logWarn('SUBSCRIBE FAILED:', err.message);
          });
        });

        client.on('message', (msgTopic: string, payload: Buffer) => {
          if (msgTopic !== topic) return;
          try {
            const doc = JSON.parse(payload.toString());
            console.log("testing", doc);
            const nextReported = doc?.state?.reported;
            if (nextReported && typeof nextReported === 'object') {
              log('REPORTED ←', nextReported);
              setReported(nextReported as T);
            }
          } catch (e: any) {
            logWarn('message parse failed:', e?.message);
          }
        });

        client.on('reconnect', () => log('RECONNECTING…'));
        client.on('close', () => setConnected(false));
        client.on('error', (err: Error) => {
          logWarn('CONNECTION ERROR:', err.message);
          setConnected(false);
        });
      } catch (e: any) {
        logWarn('CONNECT flow failed:', e?.message);
      }
    }

    connect();

    return () => {
      cancelled = true;
      try {
        clientRef.current?.end(true);
      } catch {
        /* noop */
      }
      clientRef.current = null;
      setConnected(false);
    };
  }, [session?.thingName, shadowName, getFreshIdToken]);

  return { reported, connected };
}
