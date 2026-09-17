// TODO: the Thing every IoT hook talks to should come from the signed-in
// user's `custom:thingName` claim (`session.thingName`) — the same
// attribute every AWS-backed screen in this app reads. Hardcoded here for
// testing per current instructions; swap the fallback below for the
// dynamic value once device claiming is wired into this build.
const HARDCODED_THING_NAME = 'DTX867409070336610';

/** The Thing to talk to: the session's claimed device, or the test fallback. */
export function resolveThingName(sessionThingName?: string): string {
  return sessionThingName || HARDCODED_THING_NAME;
}
