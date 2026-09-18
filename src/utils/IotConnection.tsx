import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

interface IotConnectionValue {
  /** `sba_control_v01`'s most recent reported document. */
  controlReported: Record<string, unknown> | null;
  /** `sba_config_v01`'s most recent reported document. */
  configReported: Record<string, unknown> | null;
  connected: boolean;
  status: IotConnectionStatus;
  /** Publishes desired state to a named shadow over the one shared connection. */
  publish: (shadowName: string, desired: Record<string, unknown>) => Promise<void>;
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
 */
export function IotConnectionProvider({ children }: { children: React.ReactNode }) {
  const { session, getFreshIdToken } = useSession();
  const [controlReported, setControlReported] = useState<Record<string, unknown> | null>(null);
  const [configReported, setConfigReported] = useState<Record<string, unknown> | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<IotConnectionStatus>('connecting');
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    const thingName = resolveThingName(session?.thingName);
    const controlTopics = namedShadowTopics(thingName, SBA_CONTROL_SHADOW);
    const configTopics = namedShadowTopics(thingName, SBA_CONFIG_SHADOW);

    setStatus('connecting');
    log('CONNECT flow start — thing', thingName);

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
          // This is the app's one long-lived connection — let mqtt.js
          // reconnect on its own rather than treating a drop as final.
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
          log('CONNECTED — thing', thingName);
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
              if (isControl) setControlReported(reported);
              else setConfigReported(reported);
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
      log('DISCONNECT — ending client (unmount)');
      try {
        clientRef.current?.end(true);
      } catch {
        /* noop */
      }
      clientRef.current = null;
      setConnected(false);
    };
  }, [session?.thingName, getFreshIdToken]);

  const publish = useCallback(
    (shadowName: string, desired: Record<string, unknown>): Promise<void> => {
      return new Promise((resolve, reject) => {
        const client = clientRef.current;
        if (!client || !client.connected) {
          reject(new Error('Not connected to the device yet — try again in a moment.'));
          return;
        }

        const thingName = resolveThingName(session?.thingName);
        const topic = namedShadowTopics(thingName, shadowName).update;
        const payload = desiredStatePayload(desired);
        log('PUBLISH →', topic, payload);

        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          logWarn('PUBLISH timed out — no ack within', PUBLISH_TIMEOUT_MS, 'ms');
          reject(new Error('Timed out publishing to the device.'));
        }, PUBLISH_TIMEOUT_MS);

        client.publish(topic, payload, { qos: 1 }, (error?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (error) {
            logWarn('PUBLISH FAILED:', error.message);
            reject(error);
            return;
          }
          log('PUBLISH OK —', topic);
          resolve();
        });
      });
    },
    [session?.thingName],
  );

  const value = useMemo<IotConnectionValue>(
    () => ({ controlReported, configReported, connected, status, publish }),
    [controlReported, configReported, connected, status, publish],
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
