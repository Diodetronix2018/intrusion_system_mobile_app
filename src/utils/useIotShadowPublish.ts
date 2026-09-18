import { useCallback, useRef, useState } from 'react';
import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

import { COGNITO, IOT_ENDPOINT, IOT_POLICY_NAME } from '../config/awsConfig';
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

const log = (...args: any[]) => console.log('[IoT publish]', ...args);
const logWarn = (...args: any[]) => console.warn('[IoT publish]', ...args);

/** Give up if the broker hasn't acked the publish within this long. */
const PUBLISH_TIMEOUT_MS = 15000;

/**
 * One-shot AWS IoT device-shadow publish: exchanges the caller's Cognito ID
 * token for temporary AWS credentials, opens a short-lived MQTT-over-WebSocket
 * connection to AWS IoT Core, publishes the desired state to a named shadow's
 * `update` topic, and tears the connection down once the broker acks the
 * publish (or the attempt times out).
 *
 * Mirrors the connect → publish flow the sibling 3-phase app's `IotProvider`
 * keeps open for the app's lifetime (see `setMotor` there), but scoped to a
 * single publish so a settings screen that only needs to fire one command on
 * "Save" doesn't have to hold a live socket the rest of the time.
 */
export function useIotShadowPublish(shadowName: string) {
  const { session, getFreshIdToken } = useSession();
  const [publishing, setPublishing] = useState(false);
  const clientRef = useRef<MqttClient | null>(null);

  const publish = useCallback(
    async (desired: Record<string, unknown>): Promise<void> => {
      const thingName = resolveThingName(session?.thingName);

      log('COMMAND —', desired, '→ shadow', shadowName, 'thing', thingName);
      setPublishing(true);
      try {
        log('CONNECTING…');
        const idToken = await getFreshIdToken();
        const { identityId, credentials } = await getCredentials(COGNITO, idToken);
        log('CREDENTIALS ok — identityId', identityId);

        try {
          await attachIotPolicy(COGNITO.region, IOT_POLICY_NAME, identityId, credentials);
          log('POLICY attached —', IOT_POLICY_NAME);
        } catch (e: any) {
          // Best effort — same tolerance as the sibling app: a policy that's
          // already attached (or a control-plane hiccup) shouldn't block the
          // data-plane publish below.
          logWarn('attachPolicy warning (continuing):', e?.message);
        }

        const url = presignIotWssUrl(COGNITO.region, IOT_ENDPOINT, credentials);
        const topic = namedShadowTopics(thingName, shadowName).update;
        const payload = desiredStatePayload(desired);
        log('PAYLOAD →', topic, payload);

        await new Promise<void>((resolve, reject) => {
          const streamBuilder = createRNWebSocketStreamBuilder(url);
          const client = new mqtt.MqttClient(streamBuilder, {
            // Must match the reference app's `identityId` exactly (no
            // suffix) — the attached IoT policy's `iot:Connect` resource is
            // scoped to `client/${cognito-identity.amazonaws.com:sub}`, so
            // any other clientId gets silently denied at the MQTT CONNECT
            // step (the WebSocket opens fine, but `connect` never fires).
            clientId: identityId,
            clean: true,
            keepalive: 60,
            connectTimeout: 15000,
            reconnectPeriod: 0,
            protocolVersion: 4, // MQTT 3.1.1
          });
          clientRef.current = client;

          let settled = false;
          const finish = (err?: Error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try {
              client.end(true);
            } catch {
              /* noop */
            }
            if (clientRef.current === client) clientRef.current = null;
            if (err) reject(err);
            else resolve();
          };

          const timer = setTimeout(() => {
            logWarn('PUBLISH timed out — no ack within', PUBLISH_TIMEOUT_MS, 'ms');
            finish(new Error('Timed out publishing to the device.'));
          }, PUBLISH_TIMEOUT_MS);

          client.on('connect', () => {
            log('CONNECTED — publishing to', topic, payload);
            client.publish(topic, payload, { qos: 1 }, (error?: Error) => {
              if (error) {
                logWarn('PUBLISH FAILED:', error.message);
                finish(error);
                return;
              }
              log('PUBLISH OK — acked by broker for', topic);
              finish();
            });
          });

          client.on('close', () => log('CLOSE — connection closed'));

          client.on('error', (error: Error) => {
            logWarn('CONNECTION ERROR:', error.message);
            finish(error);
          });
        });
      } finally {
        setPublishing(false);
      }
    },
    [session?.thingName, shadowName, getFreshIdToken],
  );

  return { publish, publishing };
}
