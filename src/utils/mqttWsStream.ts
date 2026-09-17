/**
 * Bridges React Native's global `WebSocket` to the stream interface that mqtt.js
 * expects from a `streamBuilder`.
 *
 * Why a custom builder instead of letting mqtt.js pick its own ws transport:
 * mqtt.js's built-in websocket transport pulls in Node/browser-specific plumbing
 * whose resolution under Metro/Hermes is unreliable. RN already ships a spec
 * WebSocket, so we wrap it with just the Node-duplex surface mqtt.js calls.
 *
 * AWS IoT MQTT over WebSocket requires the `mqtt` sub-protocol and binary frames.
 *
 * Ported from the sibling 3-phase app's `src/utils/mqttWsStream.ts`.
 */
import { Buffer } from 'buffer';
import EventEmitter from 'eventemitter3';

type QueuedWrite = { chunk: any; cb?: (err?: Error) => void };

/**
 * Returns a factory compatible with `new mqtt.MqttClient(streamBuilder, options)`.
 * `url` must be a full `wss://host/mqtt?...` URL (e.g. a SigV4-presigned IoT URL).
 */
export function createRNWebSocketStreamBuilder(url: string) {
  return function streamBuilder(): any {
    const stream: any = new EventEmitter();
    const writeQueue: QueuedWrite[] = [];
    let open = false;
    let closed = false;

    const ws = new WebSocket(url, ['mqtt']);
    ws.binaryType = 'arraybuffer';

    const flush = () => {
      while (writeQueue.length > 0) {
        const { chunk, cb } = writeQueue.shift() as QueuedWrite;
        doWrite(chunk, cb);
      }
    };

    ws.onopen = () => {
      open = true;
      flush();
      stream.emit('connect');
    };

    ws.onmessage = (event: WebSocketMessageEvent) => {
      if (closed) return;
      const data = event.data;
      let buf: Buffer;
      if (data instanceof ArrayBuffer) {
        buf = Buffer.from(new Uint8Array(data));
      } else if (typeof data === 'string') {
        buf = Buffer.from(data, 'binary');
      } else {
        buf = Buffer.from(data as any);
      }
      stream.emit('data', buf);
    };

    ws.onerror = (event: any) => {
      stream.emit('error', new Error(event?.message || 'WebSocket error'));
    };

    ws.onclose = () => {
      if (closed) return;
      closed = true;
      stream.emit('end');
      stream.emit('close', false);
    };

    function doWrite(chunk: any, cb?: (err?: Error) => void): boolean {
      try {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        // Send a fresh ArrayBuffer slice so we don't ship the whole pool buffer.
        const ab = buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength,
        );
        ws.send(ab);
        if (cb) cb();
        return true;
      } catch (e) {
        if (cb) cb(e as Error);
        stream.emit('error', e as Error);
        return false;
      }
    }

    // ---- The subset of the Node duplex API that mqtt.js calls ----

    stream.write = (
      chunk: any,
      encoding?: any,
      cb?: (err?: Error) => void,
    ): boolean => {
      if (typeof encoding === 'function') {
        cb = encoding;
      }
      if (!open) {
        writeQueue.push({ chunk, cb });
        return true;
      }
      return doWrite(chunk, cb);
    };

    stream.pipe = (dest: any) => {
      stream.on('data', (chunk: Buffer) => dest.write(chunk));
      stream.on('end', () => dest.end && dest.end());
      return dest;
    };

    // eventemitter3 has no listener cap; mqtt.js calls setMaxListeners(1000).
    stream.setMaxListeners = () => stream;

    stream.destroy = () => {
      writeQueue.length = 0;
      try {
        ws.close();
      } catch {
        /* already gone */
      }
      return stream;
    };

    stream.end = (cb?: () => void) => {
      writeQueue.length = 0;
      try {
        ws.close();
      } catch {
        /* already gone */
      }
      if (typeof cb === 'function') cb();
      return stream;
    };

    return stream;
  };
}
