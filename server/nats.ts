import { connect, JSONCodec, StringCodec, type NatsConnection, type Subscription, type KV } from 'nats';
import { log } from './vite';

const jc = JSONCodec();
const sc = StringCodec();
let _nc: NatsConnection | null = null;
let _flowKv: KV | null = null;
let _alertKv: KV | null = null;

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
    _flowKv = null;
    _alertKv = null;
  }
}

export async function getFlowKv(): Promise<KV | null> {
  if (!isNatsAvailable()) return null;
  if (_flowKv) return _flowKv;
  try {
    const js = _nc!.jetstream();
    _flowKv = await js.views.kv('checkin-flows', { ttl: 2 * 60 * 60 * 1000 });
    return _flowKv;
  } catch (err) {
    log(`NATS: failed to open checkin-flows KV: ${err}`);
    return null;
  }
}

export async function tryClaimAlert(alertId: number, windowKey: string): Promise<boolean> {
  if (!isNatsAvailable()) return true;
  try {
    if (!_alertKv) {
      const js = _nc!.jetstream();
      _alertKv = await js.views.kv('alert-dedup', { ttl: 6 * 60 * 1000 });
    }
    await _alertKv.create(`${alertId}-${windowKey}`, sc.encode('1'));
    return true;
  } catch {
    return false;
  }
}
