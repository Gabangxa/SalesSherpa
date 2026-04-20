import { connect, JSONCodec, type NatsConnection, type Subscription } from 'nats';
import { log } from './vite';

const jc = JSONCodec();
let _nc: NatsConnection | null = null;

export async function connectNats(): Promise<void> {
  const url = process.env.NATS_URL;
  if (!url) {
    log('NATS_URL not set — NATS disabled, running in single-instance mode');
    return;
  }
  try {
    _nc = await connect({ servers: url });
    log(`NATS connected to ${url}`);
  } catch (err) {
    log(`NATS connection failed (${err}) — falling back to single-instance mode`);
    _nc = null;
  }
}

export function isNatsAvailable(): boolean {
  return _nc !== null && !_nc.isClosed();
}

export function natsPublish(subject: string, data: unknown): void {
  if (!isNatsAvailable()) return;
  _nc!.publish(subject, jc.encode(data));
}

export function natsSubscribe(
  subject: string,
  handler: (subject: string, data: unknown) => void
): Subscription | null {
  if (!isNatsAvailable()) return null;
  const sub = _nc!.subscribe(subject);
  (async () => {
    for await (const msg of sub) {
      try {
        handler(msg.subject, jc.decode(msg.data));
      } catch (err) {
        log(`NATS handler error [${subject}]: ${err}`);
      }
    }
  })();
  return sub;
}

export async function drainNats(): Promise<void> {
  if (_nc && !_nc.isClosed()) {
    await _nc.drain();
    _nc = null;
  }
}
