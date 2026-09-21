import { useCallback } from 'react';

import { SBA_CONFIG_SHADOW } from '../../../../config/awsConfig';
import { useIotShadowPublish } from '../../../../utils/useIotShadowPublish';
import { usePrepopulatedState } from '../../../../utils/usePrepopulatedState';
import { normalizeIndianMobile } from '../../../../utils/validation';
import { useConfigStatus } from '../../useConfigStatus';

export type BankDetails = {
  branchCode: string;
  district: string;
  branchName: string;
  managerName: string;
  mobile: string;
  email: string;
};

export const BRANCH_CODE_MAX_LENGTH = 6;
export const DISTRICT_MAX_LENGTH = 20;
export const BRANCH_NAME_MAX_LENGTH = 50;
export const MANAGER_NAME_MAX_LENGTH = 30;
export const EMAIL_MAX_LENGTH = 60;

const DEFAULTS: BankDetails = {
  branchCode: '',
  district: '',
  branchName: '',
  managerName: '',
  mobile: '',
  email: '',
};

// The value is comma-joined, so a comma in any field would corrupt the
// fields after it — matches how Zone's free-text location field is sent.
const stripCommas = (value: string) => value.replace(/,/g, '').trim();

/**
 * Builds the device's `bnk` shadow value:
 * `"<branchCode>,<district>,<branchName>,<managerName>,<mobile>,<email>"`,
 * e.g. `"000001,CHENNAI,CHENNAI BRANCH,DIODETRONIX,1234567890,diodetronix@gmail.com"`.
 */
export function buildBnkValue(details: BankDetails): string {
  return [
    stripCommas(details.branchCode),
    stripCommas(details.district),
    stripCommas(details.branchName),
    stripCommas(details.managerName),
    normalizeIndianMobile(details.mobile),
    stripCommas(details.email),
  ].join(',');
}

/**
 * Parses the device's saved `bnk` value back into `BankDetails` — the same
 * 6 fields `buildBnkValue` writes, in the same order.
 */
export function parseBnkValue(raw: string): BankDetails | undefined {
  const parts = raw.split(',');
  if (parts.length !== 6) return undefined;
  const [branchCode, district, branchName, managerName, mobile, email] = parts;
  return { branchCode, district, branchName, managerName, mobile, email };
}

/** True once every field is blank — the device's "nothing saved yet" state. */
export function isBankDetailsEmpty(details: BankDetails): boolean {
  return Object.values(details).every(value => value.trim() === '');
}

/**
 * Same check directly against the device's raw `bnk` value (e.g. the
 * reminder banner, which has no reason to hold the full parsed form) —
 * `undefined` (not loaded yet) is deliberately *not* empty, so nothing
 * flashes before the device's actual saved value arrives.
 */
export function isBnkValueEmpty(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  const parsed = parseBnkValue(raw);
  return parsed !== undefined && isBankDetailsEmpty(parsed);
}

/**
 * Bank/branch details — a one-time batched form like Special Notify or Part
 * Setting, not a live control. `save` publishes it to the device's
 * `sba_config_v01` shadow as `{"state":{"desired":{"bnk":"<...>"}}}`.
 * Prepopulated from the device's already-saved value the first time it
 * arrives, so reopening the app shows what was last saved.
 */
export function useBankDetails(initial?: Partial<BankDetails>) {
  const { reported } = useConfigStatus();
  const [details, setDetails] = usePrepopulatedState<string, BankDetails>(
    reported?.bnk,
    parseBnkValue,
    { ...DEFAULTS, ...initial },
  );
  const { publish, publishing } = useIotShadowPublish(SBA_CONFIG_SHADOW);

  const update = useCallback(
    (patch: Partial<BankDetails>) => setDetails(prev => ({ ...prev, ...patch })),
    [setDetails],
  );

  const save = useCallback(
    () => publish({ bnk: buildBnkValue(details) }),
    [publish, details],
  );

  return { details, update, save, saving: publishing };
}
