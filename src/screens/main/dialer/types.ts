/** How the panel reaches this contact. */
export type ContactMethod = 'sms' | 'call' | 'callAndSms';

/** Which alarms this contact is told about. */
export type AlertKind = 'burglar' | 'fire' | 'burglarAndFire';

/** Everything the user supplies when creating or editing an entry. */
export type DialerEntryInput = {
  /** Ten national digits, no country code */
  phone: string;
  method: ContactMethod;
  alert: AlertKind;
};

export type DialerEntry = DialerEntryInput & {
  id: string;
};

/** Panels accept at most fifteen dial-out numbers. */
export const MAX_DIALER_ENTRIES = 15;

export const CONTACT_METHODS: { value: ContactMethod; labelKey: string }[] = [
  { value: 'sms', labelKey: 'dialer.methodSms' },
  { value: 'call', labelKey: 'dialer.methodCall' },
  { value: 'callAndSms', labelKey: 'dialer.methodCallAndSms' },
];

export const ALERT_KINDS: { value: AlertKind; labelKey: string }[] = [
  { value: 'burglar', labelKey: 'dialer.alertBurglar' },
  { value: 'fire', labelKey: 'dialer.alertFire' },
  { value: 'burglarAndFire', labelKey: 'dialer.alertBurglarAndFire' },
];
