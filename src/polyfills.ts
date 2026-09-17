/**
 * Node core polyfills required by mqtt.js when running under React Native (Hermes).
 *
 * mqtt's React-Native bundle inlines its own Buffer + readable-stream, but it still
 * reads `global.Buffer` and `global.process` (process.nextTick / process.browser).
 * Hermes does not provide a complete `process` and provides no `Buffer`, so we install
 * them here. This file MUST be imported before `mqtt` (see index.js).
 *
 * Ported from the sibling 3-phase app's `src/polyfills.ts`.
 */
import { Buffer } from 'buffer';
import nodeProcess from 'process';

const g = global as any;

if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer;
}

if (typeof g.process === 'undefined') {
  g.process = nodeProcess;
} else {
  // RN ships a partial `process`; fill in what mqtt/readable-stream rely on.
  if (typeof g.process.nextTick !== 'function') {
    g.process.nextTick = nodeProcess.nextTick;
  }
  if (typeof g.process.browser === 'undefined') {
    g.process.browser = true;
  }
  if (typeof g.process.env === 'undefined') {
    g.process.env = {};
  }
}

export {};
