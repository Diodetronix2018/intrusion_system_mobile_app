/**
 * Device claiming.
 *
 * A provisioned device ships with a QR code holding its IoT Thing name and a
 * per-device claim code, validated against the `dtx_devices` catalog table
 * (read-only — nothing is ever written back to it). Claiming records
 * ownership as a new row in `dtx_user_devices` (partition key `owner`, sort
 * key `thingName`), so many users can claim the same device, and one user
 * can hold several. Both are direct SigV4-signed DynamoDB calls using the
 * temporary credentials the Identity Pool hands out, so there is no backend
 * in the path.
 */
import {
  ConditionalCheckFailedError,
  getDynamoItem,
  putDynamoItem,
} from '../utils/dynamoDb';
import type { AwsCredentials } from './cognito';

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

/** Raised when the claim code is wrong, or the thing name isn't provisioned. */
export class ClaimRejectedError extends Error {
  constructor(message = 'This device or claim code is incorrect.') {
    super(message);
    this.name = 'ClaimRejectedError';
  }
}

/**
 * Claim a device: validate the scanned `claimCode` against the `dtx_devices`
 * catalog, then record this user's ownership as a new row in
 * `dtx_user_devices`. Many different users can claim the same device — the
 * only thing this guards against is the *same* user claiming the *same*
 * device twice, which is treated as a silent no-op rather than an error.
 * Throws {@link ClaimRejectedError} when the thing name is unknown or the
 * code doesn't match it.
 */
export async function claimDeviceInDynamo(opts: {
  region: string;
  devicesTable: string;
  userDevicesTable: string;
  thingName: string;
  claimCode: string;
  owner: string;
  creds: AwsCredentials;
}): Promise<void> {
  const device = await getDynamoItem({
    region: opts.region,
    table: opts.devicesTable,
    key: { thingName: { S: opts.thingName } },
    creds: opts.creds,
  });
  if (!device || device.claimCode !== opts.claimCode) {
    throw new ClaimRejectedError();
  }

  try {
    await putDynamoItem({
      region: opts.region,
      table: opts.userDevicesTable,
      item: {
        owner: { S: opts.owner },
        thingName: { S: opts.thingName },
        claimedAt: { S: new Date().toISOString() },
      },
      // Only blocks re-claiming a device this exact user already owns — a
      // different owner claiming the same thingName is a different item
      // (different partition key) and always allowed.
      conditionExpression: 'attribute_not_exists(#owner)',
      expressionAttributeNames: { '#owner': 'owner' },
      creds: opts.creds,
    });
  } catch (err) {
    if (!(err instanceof ConditionalCheckFailedError)) {
      throw err;
    }
    // Already claimed by this exact user — nothing to do.
  }
}
