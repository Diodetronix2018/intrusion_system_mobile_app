/**
 * AWS IoT Core data/control-plane helpers, built on top of the temporary AWS
 * credentials `getCredentials` (in `../session/cognito`) already mints from
 * the Identity Pool. No Amplify, no native SDK — plain `fetch` + `crypto-js`
 * for SigV4, matching the rest of this app's lean style.
 *
 *   - attachIotPolicy   — IoT control-plane AttachPolicy (SigV4 signed), so the
 *                          identity is allowed to publish/subscribe at all.
 *   - presignIotWssUrl  — SigV4-presigned wss://<endpoint>/mqtt for MQTT over
 *                          WebSocket — what the actual publish connects to.
 *   - namedShadowTopics — the `$aws/things/<thing>/shadow/name/<name>/...` topic
 *                          set a named device shadow uses.
 *   - desiredStatePayload — wraps a partial state as a shadow `update` payload.
 *
 * Ported from the sibling 3-phase app's `src/utils/awsIot.ts` (same signing
 * facts, verified against AWS docs / botocore):
 *   - IoT control plane (AttachPolicy): host iot.<region>.amazonaws.com,
 *     signingName "iot",             PUT /target-policies/{policyName}  body {"target": id}
 *   - IoT data plane (MQTT over WS):  host <id>-ats.iot.<region>.amazonaws.com,
 *     signingName "iotdevicegateway", GET /mqtt
 */
import CryptoJS from 'crypto-js';

import type { AwsCredentials } from '../session/cognito';

// ---------------------------------------------------------------------------
// Low-level SigV4 helpers (crypto-js)
// ---------------------------------------------------------------------------

const sha256Hex = (msg: string): string =>
  CryptoJS.SHA256(msg).toString(CryptoJS.enc.Hex);

const hmac = (key: CryptoJS.lib.WordArray | string, msg: string) =>
  CryptoJS.HmacSHA256(msg, key);

/** Derive the SigV4 signing key for a given date/region/service. */
function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): CryptoJS.lib.WordArray {
  const kDate = hmac('AWS4' + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

/** RFC3986 encode a single path/query component (encodeURIComponent + extras). */
function uriEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    c => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/** Returns { amzDate: 'YYYYMMDDTHHMMSSZ', dateStamp: 'YYYYMMDD' }. */
function amzDates(date: Date): { amzDate: string; dateStamp: string } {
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

// ---------------------------------------------------------------------------
// AttachPolicy — SigV4-signed control-plane call
// ---------------------------------------------------------------------------

export async function attachIotPolicy(
  region: string,
  policyName: string,
  target: string,
  creds: AwsCredentials,
): Promise<void> {
  const service = 'iot';
  const host = `iot.${region}.amazonaws.com`;
  const path = `/target-policies/${uriEncode(policyName)}`;
  const body = JSON.stringify({ target });
  const { amzDate, dateStamp } = amzDates(new Date());

  const payloadHash = sha256Hex(body);
  const signedHeaders = 'content-type;host;x-amz-date;x-amz-security-token';
  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-security-token:${creds.sessionToken}\n`;

  const canonicalRequest = [
    'PUT',
    path,
    '', // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(creds.secretKey, dateStamp, region, service);
  const signature = hmac(signingKey, stringToSign).toString(CryptoJS.enc.Hex);

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Host: host,
      'X-Amz-Date': amzDate,
      'X-Amz-Security-Token': creds.sessionToken,
      Authorization: authorization,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      msg = JSON.parse(text)?.message || text;
    } catch {
      /* keep raw text */
    }
    throw new Error(`AttachPolicy failed (${res.status}): ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// SigV4-presigned wss URL for MQTT over WebSocket
// ---------------------------------------------------------------------------

/**
 * Build a presigned `wss://<endpoint>/mqtt` URL for AWS IoT MQTT over WebSocket.
 * `endpoint` is the bare ATS host, e.g. `xxxx-ats.iot.ap-south-1.amazonaws.com`.
 */
export function presignIotWssUrl(
  region: string,
  endpoint: string,
  creds: AwsCredentials,
): string {
  const service = 'iotdevicegateway';
  const method = 'GET';
  const path = '/mqtt';
  const host = endpoint.replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
  const { amzDate, dateStamp } = amzDates(new Date());
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;

  let query =
    'X-Amz-Algorithm=AWS4-HMAC-SHA256' +
    '&X-Amz-Credential=' + uriEncode(`${creds.accessKeyId}/${scope}`) +
    '&X-Amz-Date=' + amzDate +
    '&X-Amz-SignedHeaders=host';

  const canonicalRequest = [
    method,
    path,
    query,
    `host:${host}\n`,
    'host',
    sha256Hex(''),
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(creds.secretKey, dateStamp, region, service);
  const signature = hmac(signingKey, stringToSign).toString(CryptoJS.enc.Hex);

  query += '&X-Amz-Signature=' + signature;
  // The session token is appended AFTER signing (not part of the signature).
  if (creds.sessionToken) {
    query += '&X-Amz-Security-Token=' + uriEncode(creds.sessionToken);
  }

  return `wss://${host}${path}?${query}`;
}

// ---------------------------------------------------------------------------
// Device shadow topic helpers
// ---------------------------------------------------------------------------

const shadowTopicSet = (base: string) => ({
  update: `${base}/update`,
  updateAccepted: `${base}/update/accepted`,
  updateRejected: `${base}/update/rejected`,
  updateDelta: `${base}/update/delta`,
  get: `${base}/get`,
  getAccepted: `${base}/get/accepted`,
  getRejected: `${base}/get/rejected`,
});

/** Classic (unnamed) device shadow topics. */
export const shadowTopics = (thingName: string) =>
  shadowTopicSet(`$aws/things/${thingName}/shadow`);

/**
 * Named device shadow topics, e.g. `$aws/things/<thing>/shadow/name/<shadowName>/...`
 * — what the device firmware's per-feature shadows (config, control, ...) use.
 */
export const namedShadowTopics = (thingName: string, shadowName: string) =>
  shadowTopicSet(`$aws/things/${thingName}/shadow/name/${shadowName}`);

/** Build a shadow `update` payload that sets desired state. */
export const desiredStatePayload = (state: Record<string, unknown>): string =>
  JSON.stringify({ state: { desired: state } });
