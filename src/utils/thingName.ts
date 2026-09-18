// TODO: the Thing every IoT hook talks to should come from the signed-in
// user's `custom:thingName` claim (`session.thingName`) — the same
// attribute every AWS-backed screen in this app reads. Hardcoded here for
// testing per current instructions.
const HARDCODED_THING_NAME = 'DTX867409070336610';

/**
 * The Thing every publish/subscribe/get call talks to.
 *
 * Forced to the hardcoded test Thing regardless of the session's own
 * claimed device — a real claim flow run against this build (e.g. while
 * testing device claiming itself) sets `session.thingName` to whatever was
 * actually claimed, which silently overrode the intended test device here.
 * Change this back to `sessionThingName || HARDCODED_THING_NAME` once
 * testing against the fixed device is done and dynamic claiming should
 * take over again.
 */
// `_sessionThingName` stays in the signature (unused, hence the `_`) so call
// sites don't change when this starts reading it again.
export function resolveThingName(_sessionThingName?: string): string {
  return HARDCODED_THING_NAME;
}
