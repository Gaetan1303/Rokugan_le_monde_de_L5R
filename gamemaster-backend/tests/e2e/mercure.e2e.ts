/**
 * Test de bout en bout contre un VRAI hub Mercure. Lancé à part : `npm run test:e2e`
 * (voir docker-compose.yml : `docker compose up -d mercure`, puis les variables du .env).
 * Variables lues via loadRealtimeConfig : MERCURE_URL, MERCURE_*_JWT_KEY, MERCURE_PROTOCOL, MERCURE_ISSUER…
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { MercurePublisher, PublishError } from '../../src/realtime/publisher.js';
import { issueSubscriberToken } from '../../src/realtime/subscriberToken.js';
import { loadRealtimeConfig, subscribeParam } from '../../src/realtime/config.js';
import { topics, topicFor, isPrivateTarget } from '../../src/contract/index.js';
import type { EventEnvelope, EventTarget } from '../../src/contract/index.js';

const cfg = process.env.MERCURE_URL ? loadRealtimeConfig(process.env) : null;
const skip = !cfg;

const REALM = 'e2e';
const publisher = cfg ? new MercurePublisher({ hubUrl: cfg.hubUrl, publisherKey: cfg.publisherKey, protocol: cfg.protocol, issuer: cfg.issuer, audience: cfg.audience }) : null;

let counter = 0;
async function publish(target: EventTarget, label: string) {
  const env: EventEnvelope = {
    eventId: `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    type: 'chat.message', v: 1, seq: counter, realmId: REALM, scope: 'e2e',
    ts: new Date().toISOString(), data: { label },
  };
  await publisher!.publish(env, topicFor(REALM, target), isPrivateTarget(target));
}

type Mode = 'bearer' | 'cookie';

function open(token: string | null, topicList: string[], mode: Mode, signal?: AbortSignal) {
  const u = new URL(cfg!.hubUrl);
  topicList.forEach((t) => u.searchParams.append(subscribeParam(cfg!.protocol), t));
  const headers: Record<string, string> = { Accept: 'text/event-stream' };
  if (token && mode === 'bearer') headers.Authorization = `Bearer ${token}`;
  if (token && mode === 'cookie') headers.Cookie = `${cfg!.cookieName}=${token}`;
  return fetch(u, { headers, signal });
}

/** Écoute `ms` millisecondes et renvoie les `label` reçus. */
async function listen(token: string | null, topicList: string[], ms: number, mode: Mode = 'bearer') {
  const ctrl = new AbortController();
  const res = await open(token, topicList, mode, ctrl.signal);
  assert.equal(res.status, 200, `abonnement refusé (${res.status})`);
  const labels: string[] = [];
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      for (const m of buf.matchAll(/^data: (.+)$/gm)) {
        try { const l = JSON.parse(m[1]).data?.label; if (l && !labels.includes(l)) labels.push(l); } catch { /* ignore */ }
      }
    }
  } catch { /* abort attendu */ } finally { clearTimeout(timer); }
  return labels;
}

const status = async (token: string | null, topicList: string[], mode: Mode = 'bearer') => {
  const ctrl = new AbortController();
  const res = await open(token, topicList, mode, ctrl.signal);
  const s = res.status;
  ctrl.abort();
  return s;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const tokenFor = (ctx: Parameters<typeof issueSubscriberToken>[1]) => issueSubscriberToken(cfg!, ctx).token;

test('isolation des topics : public / gm / autre utilisateur', { skip }, async () => {
  const all = [topics.table(REALM, 't1'), topics.tableGm(REALM, 't1'), topics.user(REALM, 'alice'), topics.user(REALM, 'bob')];
  const pPlayer = listen(tokenFor({ realmId: REALM, userId: 'alice', playerTableIds: ['t1'] }), all, 2500);
  const pGm = listen(tokenFor({ realmId: REALM, userId: 'mj', gmTableIds: ['t1'] }), all, 2500);
  await wait(800);

  await publish({ kind: 'table', tableId: 't1' }, 'public-table');
  await publish({ kind: 'tableGm', tableId: 't1' }, 'secret-gm');
  await publish({ kind: 'user', userId: 'alice' }, 'prive-alice');
  await publish({ kind: 'user', userId: 'bob' }, 'prive-bob');

  const [gotPlayer, gotGm] = await Promise.all([pPlayer, pGm]);

  assert.ok(gotPlayer.includes('public-table'), 'le joueur doit recevoir la table');
  assert.ok(gotPlayer.includes('prive-alice'), 'alice doit recevoir son topic privé');
  assert.ok(!gotPlayer.includes('secret-gm'), 'le joueur ne doit PAS recevoir /gm');
  assert.ok(!gotPlayer.includes('prive-bob'), 'alice ne doit PAS recevoir le topic de bob');

  assert.ok(gotGm.includes('public-table'));
  assert.ok(gotGm.includes('secret-gm'), 'le MJ doit recevoir /gm');
  assert.ok(!gotGm.includes('prive-alice'));
  assert.ok(!gotGm.includes('prive-bob'));
});

test('mode cookie : le jeton posé en cookie suffit', { skip }, async () => {
  const p = listen(tokenFor({ realmId: REALM, userId: 'alice', playerTableIds: ['t1'] }), [topics.table(REALM, 't1')], 2000, 'cookie');
  await wait(700);
  await publish({ kind: 'table', tableId: 't1' }, 'via-cookie');
  assert.ok((await p).includes('via-cookie'));
});

test('un joueur absent de la table ne reçoit pas les privés de cette table', { skip }, async () => {
  const p = listen(tokenFor({ realmId: REALM, userId: 'eve' }), [topics.tableGm(REALM, 't9')], 1800);
  await wait(600);
  await publish({ kind: 'tableGm', tableId: 't9' }, 'gm-t9');
  assert.ok(!(await p).includes('gm-t9'));
});

test('sans jeton : abonnement refusé (anonymous désactivé)', { skip }, async () => {
  assert.equal(await status(null, [topics.tableGm(REALM, 't1')]), 401);
});

test('jeton signé avec une mauvaise clé : 401', { skip }, async () => {
  const bad = issueSubscriberToken({ ...cfg!, subscriberKey: 'z'.repeat(40) }, { realmId: REALM, userId: 'mallory', playerTableIds: ['t1'] });
  assert.equal(await status(bad.token, [topics.table(REALM, 't1')]), 401);
});

test('jeton expiré : 401', { skip }, async () => {
  const expired = issueSubscriberToken({ ...cfg!, subscriberTtlSeconds: -60 }, { realmId: REALM, userId: 'alice', playerTableIds: ['t1'] });
  assert.equal(await status(expired.token, [topics.table(REALM, 't1')]), 401);
});

test('mauvaise audience : 401 (1.x uniquement)', { skip: skip || cfg?.protocol === 'legacy' }, async () => {
  const wrong = issueSubscriberToken({ ...cfg!, audience: 'https://autre-hub.example.com/.well-known/mercure' }, { realmId: REALM, userId: 'alice', playerTableIds: ['t1'] });
  assert.equal(await status(wrong.token, [topics.table(REALM, 't1')]), 401);
});

test('mauvais émetteur : 401 (1.x uniquement)', { skip: skip || cfg?.protocol === 'legacy' }, async () => {
  const wrong = issueSubscriberToken({ ...cfg!, issuer: 'https://pirate.example.com' }, { realmId: REALM, userId: 'alice', playerTableIds: ['t1'] });
  assert.equal(await status(wrong.token, [topics.table(REALM, 't1')]), 401);
});

test('un jeton d’abonné ne permet pas de publier', { skip }, async () => {
  // Signé avec la clé abonné : la signature est refusée côté éditeur.
  const asPublisher = new MercurePublisher({ hubUrl: cfg!.hubUrl, publisherKey: cfg!.subscriberKey, protocol: cfg!.protocol, issuer: cfg!.issuer, audience: cfg!.audience });
  const env: EventEnvelope = { eventId: '00000000-0000-4000-8000-0000000000ff', type: 'chat.message', v: 1, seq: 1, realmId: REALM, scope: 'e2e', ts: new Date().toISOString(), data: {} };
  await assert.rejects(asPublisher.publish(env, topics.table(REALM, 't1'), false), (e: unknown) => e instanceof PublishError && (e.status === 401 || e.status === 403));
});

test('un jeton abonné valide (bonne clé abonné) ne peut pas publier non plus', { skip: skip || cfg?.protocol === 'legacy' }, async () => {
  const sub = issueSubscriberToken(cfg!, { realmId: REALM, userId: 'alice', playerTableIds: ['t1'] }).token;
  const res = await fetch(cfg!.hubUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sub}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ topic: topics.table(REALM, 't1'), data: '{}' }),
  });
  assert.ok(res.status === 401 || res.status === 403, `publication par un abonné acceptée (${res.status})`);
  assert.ok(jwt.decode(sub));
});
