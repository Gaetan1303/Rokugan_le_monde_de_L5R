/**
 * Tests d'intégration sur une VRAIE base PostgreSQL (et, si MERCURE_URL est défini, un vrai hub).
 *
 *   INTEGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamemaster_test \
 *   [MERCURE_URL=... MERCURE_*_JWT_KEY=...] npm run test:integration
 *
 * ⚠️ ATTENTION : la base ciblée est VIDÉE (dropSchema) à chaque exécution. Utilise une base dédiée.
 * Ces tests sont compilés avec tsc (et non lancés via tsx) car TypeORM a besoin des métadonnées de
 * décorateurs.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { EventLog } from '../../src/models/EventLog.js';
import { EventSequence } from '../../src/models/EventSequence.js';
import { Outbox } from '../../src/models/Outbox.js';
import { appendEvent } from '../../src/services/eventService.js';
import { TypeOrmOutboxStore } from '../../src/realtime/outboxStore.js';
import { OutboxDispatcher } from '../../src/realtime/outboxDispatcher.js';
import { MercurePublisher } from '../../src/realtime/publisher.js';
import { loadRealtimeConfig, subscribeParam } from '../../src/realtime/config.js';
import { issueSubscriberToken } from '../../src/realtime/subscriberToken.js';
import { topics } from '../../src/contract/index.js';

const url = process.env.INTEGRATION_DATABASE_URL;
const skip = !url;
let ds: DataSource;

before(async () => {
  if (skip) return;
  ds = new DataSource({ type: 'postgres', url, entities: [EventLog, EventSequence, Outbox], synchronize: true, dropSchema: true });
  await ds.initialize();
});
after(async () => { if (ds?.isInitialized) await ds.destroy(); });

const chat = { messageId: 'm', authorId: 'u1', authorName: 'Doji', channel: 'in_character' as const, text: 'hai' };
const append = (realmId: string, tableId: string, text = 'hai') =>
  ds.transaction((m) => appendEvent(m, { realmId, type: 'chat.message', data: { ...chat, text }, targets: [{ kind: 'table', tableId }] }));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('seq unique et contigu sous forte concurrence (25 transactions simultanées)', { skip }, async () => {
  const events = await Promise.all(Array.from({ length: 25 }, () => append('r1', 'conc')));
  assert.deepEqual(events.map((e) => e.seq).sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => i + 1));
  const count = await ds.getRepository(EventLog).countBy({ realmId: 'r1', scope: 'table:conc' });
  assert.equal(count, 25);
});

test('portées et royaumes indépendants', { skip }, async () => {
  assert.equal((await append('r2', 'a')).seq, 1);
  assert.equal((await append('r2', 'a')).seq, 2);
  assert.equal((await append('r2', 'b')).seq, 1, 'autre table, autre séquence');
  assert.equal((await append('r3', 'a')).seq, 1, 'autre royaume, même nom de table');
});

test('rollback atomique : pas d’événement, pas d’outbox, pas de trou dans seq', { skip }, async () => {
  await append('r4', 't');
  let leakedId = '';
  await assert.rejects(ds.transaction(async (m) => {
    const ev = await appendEvent(m, { realmId: 'r4', type: 'chat.message', data: chat, targets: [{ kind: 'table', tableId: 't' }] });
    leakedId = ev.eventId;
    throw new Error('échec métier après appendEvent');
  }), /échec métier/);
  assert.equal(await ds.getRepository(EventLog).countBy({ eventId: leakedId }), 0);
  assert.equal(await ds.getRepository(Outbox).countBy({ eventId: leakedId }), 0);
  assert.equal((await append('r4', 't')).seq, 2, 'la séquence annulée est rendue');
});

test('une ligne d’outbox par cible, avec topic et visibilité', { skip }, async () => {
  const ev = await ds.transaction((m) => appendEvent(m, {
    realmId: 'r5', type: 'dice.rolled',
    data: { rollId: 'x', rolled: 1, kept: 1, dice: [], modifier: 0, total: 5, hidden: true },
    targets: [{ kind: 'tableGm', tableId: 't' }, { kind: 'user', userId: 'u1' }],
  }));
  const rows = await ds.getRepository(Outbox).find({ where: { eventId: ev.eventId }, order: { id: 'ASC' } });
  assert.deepEqual(rows.map((r) => [r.topic, r.isPrivate]), [
    ['rokugan:/realm/r5/table/t/gm', true],
    ['rokugan:/realm/r5/user/u1', true],
  ]);
});

test('unicité (royaume, portée, seq) imposée par la base', { skip }, async () => {
  const [first] = await ds.getRepository(EventLog).find({ where: { realmId: 'r2', scope: 'table:a' }, take: 1 });
  await assert.rejects(ds.getRepository(EventLog).insert({
    eventId: '11111111-1111-4111-8111-111111111111', realmId: first.realmId, scope: first.scope, seq: first.seq,
    type: 'chat.message', v: 1, data: {} as any,
  }), /unique|duplicate/i);
});

test('outbox : ordre, bail, reprise, échec définitif', { skip }, async () => {
  await ds.query('DELETE FROM outbox');
  for (let i = 0; i < 3; i++) await append('r6', 'q', `m${i}`);
  const store = new TypeOrmOutboxStore(ds);

  const a = await store.claim(2, 30);
  assert.equal(a.length, 2);
  assert.deepEqual(a.map((x) => (x.envelope.data as { text: string }).text), ['m0', 'm1'], 'dans l’ordre');
  assert.ok(a.every((x) => x.attempts === 1));

  const b = await store.claim(10, 30);
  assert.deepEqual(b.map((x) => (x.envelope.data as { text: string }).text), ['m2'], 'les lignes sous bail ne sont pas reprises');
  assert.equal((await store.claim(10, 30)).length, 0);

  await store.markFailed(a[0].outboxId, 'hub down', 0, 10);
  const retry = await store.claim(10, 30);
  assert.equal(retry.length, 1);
  assert.equal(retry[0].attempts, 2, 'tentative comptée');

  await store.markFailed(retry[0].outboxId, 'toujours down', 0, 2); // attempts (2) >= max (2) → failed
  assert.equal((await store.claim(10, 30)).length, 0);
  const failed = await ds.getRepository(Outbox).findOneByOrFail({ id: retry[0].outboxId });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.lastError, 'toujours down');

  await store.release(a[1].outboxId);
  const rel = await store.claim(10, 30);
  assert.equal(rel.length, 1);
  assert.equal(rel[0].attempts, 1, 'release ne compte pas la tentative');

  await store.markPublished(rel[0].outboxId);
  const pub = await ds.getRepository(Outbox).findOneByOrFail({ id: rel[0].outboxId });
  assert.equal(pub.status, 'published');
  assert.ok(pub.publishedAt);
});

test('outbox : un bail expiré est repris', { skip }, async () => {
  await ds.query('DELETE FROM outbox');
  await append('r7', 'q');
  const store = new TypeOrmOutboxStore(ds);
  assert.equal((await store.claim(5, 1)).length, 1);
  assert.equal((await store.claim(5, 1)).length, 0);
  await wait(1300);
  const again = await store.claim(5, 30);
  assert.equal(again.length, 1);
  assert.equal(again[0].attempts, 2);
});

test('outbox : des consommateurs concurrents ne se marchent pas dessus (SKIP LOCKED)', { skip }, async () => {
  await ds.query('DELETE FROM outbox');
  for (let i = 0; i < 40; i++) await append('r8', 'q', `m${i}`);
  const store = new TypeOrmOutboxStore(ds);
  const seen: string[] = [];
  for (let round = 0; round < 5; round++) {
    const batches = await Promise.all([1, 2, 3, 4].map(() => store.claim(10, 30)));
    for (const b of batches) seen.push(...b.map((x) => x.outboxId));
  }
  assert.equal(new Set(seen).size, seen.length, 'aucune ligne réservée deux fois');
  assert.equal(seen.length, 40, 'toutes les lignes finissent réservées');
});

test('dispatcher : publie le lot et marque les lignes', { skip }, async () => {
  await ds.query('DELETE FROM outbox');
  for (let i = 0; i < 5; i++) await append('r9', 'q', `m${i}`);
  const sent: Array<[number, string, boolean]> = [];
  const n = await new OutboxDispatcher(new TypeOrmOutboxStore(ds), { publish: async (e, topic, priv) => { sent.push([e.seq, topic, priv]); } }).tick();
  assert.equal(n, 5);
  assert.deepEqual(sent.map((s) => s[0]), [1, 2, 3, 4, 5]);
  assert.equal(await ds.getRepository(Outbox).countBy({ status: 'published' }), 5);
});

test('verrou « ajout seul » du journal (docs/sql/001)', { skip }, async () => {
  // Une fois compilé, ce fichier est dans .tmp-integration/tests/integration/ : la racine du backend est 3 niveaux plus haut.
  await ds.query(readFileSync(fileURLToPath(new URL('../../../docs/sql/001_event_log_append_only.sql', import.meta.url)), 'utf8'));
  await assert.rejects(ds.query(`UPDATE event_log SET type = 'x'`), /ajout seul/);
  await assert.rejects(ds.query(`DELETE FROM event_log`), /ajout seul/);
  await append('r10', 'q'); // l'INSERT reste permis
});

// ---- Chaîne complète : transaction → outbox → dispatcher → VRAI hub → abonné ----
const mcfg = process.env.MERCURE_URL ? loadRealtimeConfig(process.env) : null;
test('chaîne complète : PostgreSQL → dispatcher → hub Mercure → abonné', { skip: skip || !mcfg }, async () => {
  await ds.query('DELETE FROM outbox');
  const token = issueSubscriberToken(mcfg!, { realmId: 'live', userId: 'alice', playerTableIds: ['t1'] }).token;
  const u = new URL(mcfg!.hubUrl);
  u.searchParams.append(subscribeParam(mcfg!.protocol), topics.table('live', 't1'));
  const ctrl = new AbortController();
  const res = await fetch(u, { headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' }, signal: ctrl.signal });
  assert.equal(res.status, 200);

  const received: Array<{ seq: number; text: string }> = [];
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  const reading = (async () => {
    let buf = '';
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        for (const m of buf.matchAll(/^data: (.+)$/gm)) {
          const e = JSON.parse(m[1]);
          if (!received.some((r) => r.seq === e.seq)) received.push({ seq: e.seq, text: e.data.text });
        }
      }
    } catch { /* abort */ }
  })();
  await wait(700);

  for (let i = 1; i <= 3; i++) await append('live', 't1', `tour-${i}`);
  const dispatcher = new OutboxDispatcher(new TypeOrmOutboxStore(ds), new MercurePublisher({
    hubUrl: mcfg!.hubUrl, publisherKey: mcfg!.publisherKey, protocol: mcfg!.protocol, issuer: mcfg!.issuer, audience: mcfg!.audience,
  }));
  assert.equal(await dispatcher.tick(), 3);
  await wait(800);
  ctrl.abort();
  await reading;

  assert.deepEqual(received.sort((a, b) => a.seq - b.seq), [
    { seq: 1, text: 'tour-1' }, { seq: 2, text: 'tour-2' }, { seq: 3, text: 'tour-3' },
  ]);
  assert.equal(await ds.getRepository(Outbox).countBy({ status: 'published' }), 3);
});
