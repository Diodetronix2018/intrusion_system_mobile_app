/**
 * `usePrepopulatedState` backs every settings/zone/dialer screen's
 * prepopulate-from-device behaviour. It has to satisfy three things at
 * once: seed from the device, never let a live update clobber an
 * in-progress edit, and — the bug this file guards against — still pick up
 * a change made directly on the panel while the screen is just sitting
 * there unedited.
 *
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { usePrepopulatedState } from '../src/utils/usePrepopulatedState';

type Value = { name: string };

const parse = (raw: string): Value | undefined => (raw ? { name: raw } : undefined);

const DEFAULTS: Value = { name: 'default' };

type Api = { value: Value; setValue: (next: Value | ((prev: Value) => Value)) => void };

/** Mounts a small harness exposing the hook's live value/setter, plus a way
 *  to change `raw` from the test the way a device update actually would. */
function mount(initialRaw: string | undefined) {
  const seen: { current: Api | null } = { current: null };
  let setRawState: (raw: string | undefined) => void = () => {};

  function Harness() {
    const [raw, setRaw] = React.useState(initialRaw);
    setRawState = setRaw;
    const [value, setValue] = usePrepopulatedState<string, Value>(raw, parse, DEFAULTS);
    seen.current = { value, setValue };
    return null;
  }

  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<Harness />);
  });

  return {
    seen,
    setRaw: (raw: string | undefined) => ReactTestRenderer.act(() => setRawState(raw)),
    unmount: () => ReactTestRenderer.act(() => tree!.unmount()),
  };
}

test('starts at the defaults until raw is available', () => {
  const { seen, unmount } = mount(undefined);
  expect(seen.current!.value).toEqual(DEFAULTS);
  unmount();
});

test('seeds from raw as soon as it parses', () => {
  const { seen, unmount } = mount('first');
  expect(seen.current!.value).toEqual({ name: 'first' });
  unmount();
});

test('a live update flows through while the screen is untouched (the panel-change bug)', () => {
  const { seen, setRaw, unmount } = mount('first');
  expect(seen.current!.value).toEqual({ name: 'first' });

  // Nobody has edited anything in the app — this is a change made directly
  // on the panel arriving over the shared subscription.
  setRaw('changed-on-panel');
  expect(seen.current!.value).toEqual({ name: 'changed-on-panel' });
  unmount();
});

test('a live update does not clobber an in-progress local edit', () => {
  const { seen, setRaw, unmount } = mount('first');

  ReactTestRenderer.act(() => {
    seen.current!.setValue({ name: 'user is typing' });
  });
  expect(seen.current!.value).toEqual({ name: 'user is typing' });

  // A change lands from elsewhere while the user is still mid-edit.
  setRaw('changed-elsewhere');
  expect(seen.current!.value).toEqual({ name: 'user is typing' });
  unmount();
});

test('the device echoing back a just-saved value does not reset the form, and still updates the baseline for later external changes', () => {
  const { seen, setRaw, unmount } = mount('first');

  ReactTestRenderer.act(() => {
    seen.current!.setValue({ name: 'saved-value' });
  });

  // The device confirms exactly what was just saved (a save-echo).
  setRaw('saved-value');
  expect(seen.current!.value).toEqual({ name: 'saved-value' });

  // A *later*, genuinely different external change must still come
  // through — the echo above must not have permanently frozen the sync.
  setRaw('changed-after-save');
  expect(seen.current!.value).toEqual({ name: 'changed-after-save' });
  unmount();
});
