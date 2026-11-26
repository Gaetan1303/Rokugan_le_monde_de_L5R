import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { EntityManager } from 'typeorm';
import { appendEvent } from '../src/services/eventService.js';
import { EventLog } from '../src/models/EventLog.js';
import { Outbox } from '../src/models/Outbox.js';
import { InvalidEventError } from '../src/realtime/validateEvent.js';

/** Faux EntityManager : simule le compteur de séquence et capture les écritures. */
function fakeManager() {
  const counters = new Map<string, number>();
  const inserts: Array<{ entity: unknown; values: any }> = [];
  const manager = {
    async query(sql: string, params: unknown[]) {
      assert.match(sql, /ON CONFLICT/);
      const key = `${params[0]}|${params[1]}`;
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return [{ last: String(next) }];
    },
    async insert(entity: unknown, values: any) { inserts.push({ entity, values }); },
  } as unknown as EntityManager;
  return { manager, inserts };
}

const chat = { messageId: 'm1', authorId: 'u1', authorName: 'Doji', channel: 'in_character' as const, text: 'Salutations' };

test('seq croît par portée et reste indépendant entre portées', async () => {
  const { manager } = fakeManager();
  const a1 = await appendEvent(manager, { realmId: 'r', type: 'chat.message', data: chat, targets: [{ kind: 'table', tableId: 'a' }] });
  const a2 = await appendEvent(manager, { realmId: 'r', type: 'chat.message', data: chat, targets: [{ kind: 'table', tableId: 'a' }] });
  const b1 = await appendEvent(manager, { realmId: 'r', type: 'chat.message', data: chat, targets: [{ kind: 'table', tableId: 'b' }] });
  assert.deepEqual([a1.seq, a2.seq, b1.seq], [1, 2, 1]);
  assert.equal(a1.scope, 'table:a');
});

test('une ligne de journal + une ligne d’outbox par cible', async () => {
  const { manager, inserts } = fakeManager();
  const ev = await appendEvent(manager, {
    realmId: 'r', type: 'dice.rolled', actorId: 'u1',
    data: { rollId: 'x', rolled: 3, kept: 2, dice: [], modifier: 0, total: 12, hidden: false },
    targets: [{ kind: 'table', tableId: 't' }, { kind: 'world' }],
  });
  const log = inserts.find((i) => i.entity === EventLog)!.values;
  const outbox = inserts.find((i) => i.entity === Outbox)!.values as Array<{ topic: string; isPrivate: boolean; eventId: string }>;
  assert.equal(log.eventId, ev.eventId);
  assert.equal(log.actorId, 'u1');
  assert.equal(outbox.length, 2);
  assert.deepEqual(outbox.map((o) => o.topic), ['rokugan:/realm/r/table/t', 'rokugan:/realm/r/world']);
  assert.ok(outbox.every((o) => o.eventId === ev.eventId && o.isPrivate === false));
});

test('un jet caché part sur le topic /gm, privé', async () => {
  const { manager, inserts } = fakeManager();
  await appendEvent(manager, {
    realmId: 'r', type: 'dice.rolled',
    data: { rollId: 'x', rolled: 1, kept: 1, dice: [], modifier: 0, total: 5, hidden: true },
    targets: [{ kind: 'tableGm', tableId: 't' }],
  });
  const outbox = inserts.find((i) => i.entity === Outbox)!.values as Array<{ topic: string; isPrivate: boolean }>;
  assert.equal(outbox[0].topic, 'rokugan:/realm/r/table/t/gm');
  assert.equal(outbox[0].isPrivate, true);
});

test('identifiant de cible dangereux refusé avant toute écriture', async () => {
  const { manager, inserts } = fakeManager();
  await assert.rejects(
    appendEvent(manager, { realmId: 'r', type: 'chat.message', data: chat, targets: [{ kind: 'table', tableId: '../admin' }] }),
    /invalide/);
  assert.equal(inserts.length, 0);
});

test('enveloppe invalide refusée (royaume vide)', async () => {
  const { manager, inserts } = fakeManager();
  await assert.rejects(
    appendEvent(manager, { realmId: '', type: 'chat.message', data: chat, targets: [{ kind: 'world' }] }),
    InvalidEventError);
  assert.equal(inserts.length, 0);
});
