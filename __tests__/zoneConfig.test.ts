describe('onlyStateDiffers (Away mode zone saves)', () => {
  const { onlyStateDiffers } = require('../src/screens/main/zone/useZoneConfig');
  const base = {
    state: 'on', schedule: 'always', contact: 'nc', exitDelay: 10, entryDelay: 10,
    smartCheck: false, waitTime: 0, detectionCount: 1, location: 'Main Door',
  };
  test('an On/Off flip alone is allowed', () =>
    expect(onlyStateDiffers({ ...base, state: 'off' }, base)).toBe(true));
  test('any other change is not', () =>
    expect(onlyStateDiffers({ ...base, state: 'off', exitDelay: 20 }, base)).toBe(false));
});
