/**
 * SigV4-signed DynamoDB access (JSON protocol), for reading a device's
 * event/telemetry history table directly from the app — no backend.
 *
 * Needs the caller's temporary AWS credentials (from Cognito's Identity
 * Pool, via `getCredentials` in `../session/cognito`) to already carry
 * `dynamodb:Query` on the target table. That permission is granted through
 * the Identity Pool's authenticated IAM role — a completely different place
 * from the AWS IoT policy this app attaches elsewhere (`attachIotPolicy` in
 * `./awsIot`), which only covers `iot:Connect`/`Publish`/`Subscribe`.
 *
 * Ported from the sibling 3-phase app's `queryTelemetry`/`unmarshallDynamo`
 * (`src/utils/awsIot.ts` there), reusing this app's own SigV4 primitives.
 */
import CryptoJS from 'crypto-js';

import type { AwsCredentials } from '../session/cognito';
import { amzDates, getSigningKey, hmac, sha256Hex } from './awsIot';

const log = (...args: any[]) => console.log('[DynamoDB]', ...args);

/**
 * SigV4-sign and POST a JSON body to an AWS JSON-protocol service (host
 * `<service>.<region>.amazonaws.com`, X-Amz-Target dispatch). Returns the
 * parsed response; throws (with the service's `__type` attached as
 * `.awsType`) on a non-2xx so callers can branch on specific errors.
 */
export async function sigV4Post(
  service: string,
  region: string,
  target: string,
  contentType: string,
  body: string,
  creds: AwsCredentials,
): Promise<any> {
  const host = `${service}.${region}.amazonaws.com`;
  const { amzDate, dateStamp } = amzDates(new Date());

  const signedHeaders = 'content-type;host;x-amz-date;x-amz-security-token;x-amz-target';
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
    const err = new Error(json?.message || json?.Message || type || `HTTP ${res.status}`);
    (err as any).awsType = type;
    throw err;
  }
  return json;
}

/**
 * Convert one DynamoDB attribute-value (the low-level `{ S | N | BOOL | M | L … }`
 * wire shape the JSON API returns) into a plain JS value, recursing through
 * maps and lists. Numbers come back as `number`, so callers don't have to
 * re-parse.
 */
export function unmarshallDynamo(av: any): any {
  if (av == null || typeof av !== 'object') return av;
  if ('S' in av) return av.S;
  if ('N' in av) return Number(av.N);
  if ('BOOL' in av) return av.BOOL;
  if ('NULL' in av) return null;
  if ('M' in av) {
    const out: Record<string, any> = {};
    for (const k of Object.keys(av.M)) out[k] = unmarshallDynamo(av.M[k]);
    return out;
  }
  if ('L' in av) return (av.L as any[]).map(unmarshallDynamo);
  if ('SS' in av) return av.SS as string[];
  if ('NS' in av) return (av.NS as string[]).map(Number);
  return av;
}

/** One row of a device-telemetry table, unmarshalled into plain JS values. */
export type TelemetryRow = Record<string, any>;

/**
 * Query a device-telemetry table for one Thing's rows, newest first.
 * Assumes a partition key named `thingName` (matching every other table in
 * this app) and, if the table has one, a chronological sort key — harmless
 * to request descending order even if there isn't one.
 *
 * Requires the caller's temporary credentials to allow `dynamodb:Query` on
 * the table (see the module doc comment).
 */
export async function queryTelemetry(opts: {
  region: string;
  table: string;
  thingName: string;
  creds: AwsCredentials;
  limit?: number;
}): Promise<TelemetryRow[]> {
  const limit = opts.limit ?? 50;
  const body = JSON.stringify({
    TableName: opts.table,
    KeyConditionExpression: '#tn = :tn',
    ExpressionAttributeNames: { '#tn': 'thingName' },
    ExpressionAttributeValues: { ':tn': { S: opts.thingName } },
    // Descending by sort key (if any) → most recent rows first.
    ScanIndexForward: false,
    Limit: limit,
  });
  log('QUERY →', opts.table, 'thingName =', opts.thingName, 'limit =', limit);

  const res = await sigV4Post(
    'dynamodb',
    opts.region,
    'DynamoDB_20120810.Query',
    'application/x-amz-json-1.0',
    body,
    opts.creds,
  );

  const items: any[] = Array.isArray(res?.Items) ? res.Items : [];
  log(
    'QUERY OK ← Count:', res?.Count,
    'ScannedCount:', res?.ScannedCount,
    'Items:', items.length,
  );

  const rows = items.map(item => unmarshallDynamo({ M: item }) as TelemetryRow);
  if (rows[0]) {
    log('FIRST ROW KEYS →', Object.keys(rows[0]));
  }
  return rows;
}

/** Thrown when a `PutItem`'s `ConditionExpression` wasn't met. */
export class ConditionalCheckFailedError extends Error {
  constructor(message = 'Conditional check failed.') {
    super(message);
    this.name = 'ConditionalCheckFailedError';
  }
}

/**
 * Fetch a single item by its exact primary key. `key` is already in the
 * low-level `{ S: '…' }` attribute-value shape DynamoDB's JSON API expects.
 * Returns `undefined` if no item exists at that key.
 */
export async function getDynamoItem(opts: {
  region: string;
  table: string;
  key: Record<string, any>;
  creds: AwsCredentials;
}): Promise<Record<string, any> | undefined> {
  const body = JSON.stringify({ TableName: opts.table, Key: opts.key });
  const res = await sigV4Post(
    'dynamodb',
    opts.region,
    'DynamoDB_20120810.GetItem',
    'application/x-amz-json-1.0',
    body,
    opts.creds,
  );
  return res?.Item ? (unmarshallDynamo({ M: res.Item }) as Record<string, any>) : undefined;
}

/**
 * Put a whole item (already in attribute-value shape), optionally guarded by
 * a `ConditionExpression` — throws {@link ConditionalCheckFailedError} (not
 * the raw AWS error) when the condition isn't met, so callers can branch on
 * it without string-matching `awsType` themselves.
 */
export async function putDynamoItem(opts: {
  region: string;
  table: string;
  item: Record<string, any>;
  conditionExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  creds: AwsCredentials;
}): Promise<void> {
  const body = JSON.stringify({
    TableName: opts.table,
    Item: opts.item,
    ...(opts.conditionExpression ? { ConditionExpression: opts.conditionExpression } : {}),
    ...(opts.expressionAttributeNames
      ? { ExpressionAttributeNames: opts.expressionAttributeNames }
      : {}),
  });
  try {
    await sigV4Post(
      'dynamodb',
      opts.region,
      'DynamoDB_20120810.PutItem',
      'application/x-amz-json-1.0',
      body,
      opts.creds,
    );
  } catch (err: any) {
    if (String(err?.awsType).includes('ConditionalCheckFailedException')) {
      throw new ConditionalCheckFailedError();
    }
    throw err;
  }
}

/** One row of `dtx_user_devices` — a device a user has claimed. */
export type UserDeviceRow = { thingName: string; claimedAt?: string; label?: string };

/**
 * Query `dtx_user_devices` (partition key `owner`) for every device a user
 * has claimed — the list the app lets them switch between.
 */
export async function queryUserDevices(opts: {
  region: string;
  table: string;
  owner: string;
  creds: AwsCredentials;
}): Promise<UserDeviceRow[]> {
  const body = JSON.stringify({
    TableName: opts.table,
    KeyConditionExpression: '#o = :o',
    ExpressionAttributeNames: { '#o': 'owner' },
    ExpressionAttributeValues: { ':o': { S: opts.owner } },
  });
  const res = await sigV4Post(
    'dynamodb',
    opts.region,
    'DynamoDB_20120810.Query',
    'application/x-amz-json-1.0',
    body,
    opts.creds,
  );
  const items: any[] = Array.isArray(res?.Items) ? res.Items : [];
  return items.map(item => unmarshallDynamo({ M: item }) as UserDeviceRow);
}
