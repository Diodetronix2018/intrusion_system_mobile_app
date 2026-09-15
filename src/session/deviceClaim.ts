/**
 * Device claiming — ported from the sibling 3-phase app.
 *
 * A provisioned device ships with a QR code holding its IoT Thing name and a
 * one-time claim code. Claiming is a single conditional write against the
 * DynamoDB claims table, signed with the temporary credentials the Identity
 * Pool hands out, so there is no backend in the path.
 */
import CryptoJS from 'crypto-js';

import type { AwsCredentials } from './cognito';

// ---------------------------------------------------------------------------
// SigV4 signing (crypto-js)
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

/** Returns { amzDate: 'YYYYMMDDTHHMMSSZ', dateStamp: 'YYYYMMDD' }. */
function amzDates(date: Date): { amzDate: string; dateStamp: string } {
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

/**
 * SigV4-sign and POST a JSON body to an AWS JSON-protocol service (host
 * `<service>.<region>.amazonaws.com`, X-Amz-Target dispatch). Returns the
 * parsed response; throws with the service's `__type`/message on a non-2xx so
 * callers can branch on specific errors (e.g. ConditionalCheckFailedException).
 */
async function sigV4Post(
  service: string,
  region: string,
  target: string,
  contentType: string,
  body: string,
  creds: AwsCredentials,
): Promise<any> {
  const host = `${service}.${region}.amazonaws.com`;
  const { amzDate, dateStamp } = amzDates(new Date());

  const signedHeaders =
    'content-type;host;x-amz-date;x-amz-security-token;x-amz-target';
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-security-token:${creds.sessionToken}\n` +
    `x-amz-target:${target}\n`;

  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    sha256Hex(body),
  ].join('\n');

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signature = hmac(
    getSigningKey(creds.secretKey, dateStamp, region, service),
    stringToSign,
  ).toString(CryptoJS.enc.Hex);

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}/`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Host: host,
      'X-Amz-Date': amzDate,
      'X-Amz-Security-Token': creds.sessionToken,
      'X-Amz-Target': target,
      Authorization: authorization,
    },
    body,
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* leave json empty; handled below */
  }
  if (!res.ok) {
    const type = String(json?.__type || '');
    const err = new Error(
      json?.message || json?.Message || type || `HTTP ${res.status}`,
    );
    (err as any).awsType = type;
    throw err;
  }
  return json;
}

// ---------------------------------------------------------------------------
// The claim QR
// ---------------------------------------------------------------------------

/** A device's identity as read out of its claim QR code. */
export interface ClaimQr {
  thingName: string;
  claimCode: string;
}

/** Every provisioned Thing name starts with this (e.g. DTX867409070337741). */
export const THING_NAME_PREFIX = 'DTX';

/**
 * Canonicalize a Thing name to the device's registered IoT name. The QR prints
 * it with a readability separator (`DTX_867…` or `DTX-867…`), but the actual IoT
 * thing / DynamoDB key is `DTX867…` — so strip `-`/`_`. Case is preserved; only
 * the separators are removed. Must be applied everywhere a scanned/typed name is
 * turned into the value we claim and connect with.
 */
export const normalizeThingName = (raw: string): string =>
  (raw ?? '').trim().replace(/[-_]/g, '');

/**
 * Parse the claim QR the provisioner prints, e.g.
 *   https://claim.diodetronix.com/d?t=DTX_867409070337741&c=PYSY-99U5-FZGE&type=…
 * The Thing name is the `t` param (`DTX_` + IMEI) and the claim code is `c`
 * (`PYSY-99U5-FZGE`); the rest is metadata we ignore. Returns the pair, or null
 * if it isn't a device QR. Case is preserved EXACTLY — the thing name must match
 * the device's IoT thing name and DynamoDB key byte-for-byte.
 */
export function parseClaimQr(payload: string): ClaimQr | null {
  try {
    const raw = (payload ?? '').trim();
    // Accept the full URL, a bare query string (`t=…&c=…`), or a `?…` fragment.
    const qIndex = raw.indexOf('?');
    const query = qIndex >= 0 ? raw.slice(qIndex + 1) : raw;
    const params = new URLSearchParams(query);

    const rawThing = params.get('t')?.trim();
    const claimCode = params.get('c')?.trim();
    if (!rawThing || !claimCode) {
      return null;
    }
    // Strip the QR's `-`/`_` separator so the name matches the IoT thing exactly.
    return { thingName: normalizeThingName(rawThing), claimCode };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The claim itself
// ---------------------------------------------------------------------------

/** Raised when the claim code is wrong or the device is already claimed. */
export class ClaimRejectedError extends Error {
  constructor(
    message = 'This device is already claimed, or the code is incorrect.',
  ) {
    super(message);
    this.name = 'ClaimRejectedError';
  }
}

/**
 * Atomically claim a device directly against the DynamoDB claims table: set
 * `claimed=true` and `owner=<sub>`, but only if it's currently unclaimed and the
 * supplied claim code matches. The single conditional write both checks and
 * flips, so two racing claims can't both win. Throws {@link ClaimRejectedError}
 * when the condition fails.
 */
export async function claimDeviceInDynamo(opts: {
  region: string;
  table: string;
  thingName: string;
  claimCode: string;
  owner: string;
  creds: AwsCredentials;
}): Promise<void> {
  const body = JSON.stringify({
    TableName: opts.table,
    Key: { thingName: { S: opts.thingName } },
    // `claimed` and `owner` are (or border on) reserved words — alias all names.
    UpdateExpression: 'SET #claimed = :true, #owner = :owner',
    ConditionExpression: '#claimed = :false AND #code = :codeval',
    ExpressionAttributeNames: {
      '#claimed': 'claimed',
      '#owner': 'owner',
      '#code': 'claimCode',
    },
    ExpressionAttributeValues: {
      ':true': { BOOL: true },
      ':false': { BOOL: false },
      ':owner': { S: opts.owner },
      ':codeval': { S: opts.claimCode },
    },
    ReturnValues: 'NONE',
  });

  try {
    await sigV4Post(
      'dynamodb',
      opts.region,
      'DynamoDB_20120810.UpdateItem',
      'application/x-amz-json-1.0',
      body,
      opts.creds,
    );
  } catch (err: any) {
    if (String(err?.awsType).includes('ConditionalCheckFailedException')) {
      throw new ClaimRejectedError();
    }
    throw err;
  }
}
