/**
 * Shared zone-status types — the Main-screen preview card that used to live
 * here (single-zone preview + "View all") was removed; the System Status
 * card's Zone/Tamper tiles link straight to Zone Details instead. Zone
 * Details and `useMainStatus` still key off these types.
 */
export type ZoneCondition = 'normal' | 'warning' | 'fault';

export type ZoneStatusEntry = {
  /** 1-based zone number, rendered as Z01, Z02… */
  number: number;
  /** The device's own `zloc` text for this zone, shown as-is (not a translation key). */
  location: string;
  condition: ZoneCondition;
};
