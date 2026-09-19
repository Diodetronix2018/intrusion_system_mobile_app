/**
 * The Thing every publish/subscribe/get call talks to — the signed-in
 * user's currently active device (`session.activeThingName`). Defaults to
 * the first device a user has claimed and is switchable among everything in
 * `session.devices` via `useSession().switchDevice` (see the Main screen's
 * device switcher).
 */
export function resolveThingName(sessionThingName?: string): string {
  return sessionThingName ?? '';
}
