import { useIotConnection } from '../../utils/IotConnection';

/**
 * Shape of `sba_config_v01`'s reported shadow document — the device's own
 * saved settings, each field a comma/semicolon-encoded string in the same
 * format its screen already publishes in desired-state updates. See each
 * screen's `use*Settings` hook for the field's own parse/build pair.
 */
export interface ConfigReported {
  /** Zone tab — `"<idx>,<on>,<mode>,<contact>,<exitDelay>,<entryDelay>,<smartCheck>,<waitTime>,<detectionCount>,<location>"` per zone (0-7) plus tamper (8), joined with `;`. */
  zon?: string;
  /** Dialer — `"<slot>,<method>,<alert>,<phone>"` per entry, joined with `;`; empty string when there are none. */
  dia?: string;
  /** Special Notify — `"<acFail>,<batteryFail>,<userGroup>"`. */
  nty?: string;
  /** Part Setting — 9 `0`/`1` characters, zones 1-8 then tamper. */
  prt?: string;
  /** Silence — `"<faultMode>,<faultTimer>,<alarmMode>,<alarmTimer>"`. */
  sln?: string;
  /** Repeat — `"<call>,<voice>,<admin>"`. */
  rpt?: string;
  /** Auto ARM — `"<enabled>,<hour>,<minute>"`. */
  aar?: string;
  /** Relay — `"0"` for all zones, or the 1-based zone number. */
  rly?: string;
  /** Hooter Notify — `"1"` enabled, `"2"` disabled. */
  hnt?: string;
  /** Bank Details — `"<branchCode>,<district>,<branchName>,<managerName>,<mobile>,<email>"`. */
  bnk?: string;
}

/**
 * The device's already-saved settings, read off the app's one shared MQTT
 * connection (`IotConnectionProvider`, mounted at the navigation root)
 * rather than opening a subscription of its own — every config screen
 * (Zone, Dialer, and the Settings detail pages) reads the same fetch.
 */
export function useConfigStatus(): { reported: ConfigReported | null; connected: boolean } {
  const { configReported, connected } = useIotConnection();
  return { reported: configReported as ConfigReported | null, connected };
}
