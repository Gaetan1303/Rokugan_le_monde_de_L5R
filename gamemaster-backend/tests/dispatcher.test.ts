import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OutboxDispatcher } from '../src/realtime/outboxDispatcher.js';
import type { OutboxStore, ClaimedOutboxItem } from '../src/realtime/outboxStore.js';
import type { EventPublisher } from '../src/realtime/publisher.js';
import type { EventEnvelope } from '../src/contract/index.js';

const item = (id: number, scope: string, seq: number, attempts = 1): ClaimedOutboxItem => ({
  outboxId: String(id), attempts, topic: `rokugan:/realm/r/${scope}`, isPrivate: false,
  envelope: { eventId: `e${id}`, type: 'chat.message', v: 1, seq, realmId: 'r', scope, ts: '2026-11-20T10:00:00.000Z', data: {} } as EventEnvelope,
});

class MemStore implements OutboxStore {
  published: string[] = []; failed: Array<{ id: string; retry: number; max: number }> = []; released: string[] = [];
  constructor(private items: ClaimedOutboxItem[]) {}
  async claim() { const i = this.items; this.items = []; return i; }
  async markPublished(id: string) { this.published.push(id); }
  async markFailed(id: string, _e: string, retry: number, max: number) { this.failed.push({ id, retry, max }); }
  async release(id: string) { this.released.push(id); }
}

test('publie tout dans l’ordre', async () => {
  const sent: string[] = [];
  const store = new MemStore([item(1, 'table:a', 1), item(2, 'table:a', 2)]);
  const n = await new OutboxDispatcher(store, { publish: async (e) => { sent.push(e.eventId); } }).tick();
  assert.equal(n, 2);
  assert.deepEqual(sent, ['e1', 'e2']);
  assert.deepEqual(store.published, ['1', '2']);
});

test('après un échec, la suite de la MÊME portée est relâchée, pas les autres', async () => {
  const sent: string[] = [];
  const store = new MemStore([item(1, 'table:a', 1), item(2, 'table:a', 2), item(3, 'table:b', 1)]);
  const publisher: EventPublisher = { publish: async (e) => { if (e.eventId === 'e1') throw new Error('hub down'); sent.push(e.eventId); } };
  const n = await new OutboxDispatcher(store, publisher).tick();
  assert.equal(n, 1);
  assert.deepEqual(sent, ['e3']);
  assert.deepEqual(store.released, ['2']);
  assert.equal(store.failed[0].id, '1');
});

test('backoff exponentiel plafonné', async () => {
  const store = new MemStore([item(1, 'table:a', 1, 3), item(2, 'table:b', 1, 20)]);
  await new OutboxDispatcher(store, { publish: async () => { throw new Error('x'); } }, { maxBackoffSeconds: 300 }).tick();
  assert.equal(store.failed[0].retry, 8);
  assert.equal(store.failed[1].retry, 300);
  assert.equal(store.failed[0].max, 10);
});

test('lot vide : rien à faire', async () => {
  assert.equal(await new OutboxDispatcher(new MemStore([]), { publish: async () => {} }).tick(), 0);
});
