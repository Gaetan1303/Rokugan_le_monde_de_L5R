/**
 * Parcours complet contre un serveur Rokugan lancé (tsx ou build) + un hub Mercure :
 *   inscription → connexion → table → /api/realtime/session → abonnement au hub → réception.
 * Variables : API_URL, MERCURE_URL, MERCURE_* (mêmes que le serveur). Lancer : npm run test:session
 */
import assert from 'node:assert/strict';
import { MercurePublisher } from '../../src/realtime/publisher.js';
import { loadRealtimeConfig, subscribeParam } from '../../src/realtime/config.js';
import { topicFor } from '../../src/contract/index.js';
import type { EventEnvelope } from '../../src/contract/index.js';

const API = process.env.API_URL!;
const cfg = loadRealtimeConfig(process.env)!;
const publisher = new MercurePublisher({ hubUrl: cfg.hubUrl, publisherKey: cfg.publisherKey, protocol: cfg.protocol, issuer: cfg.issuer, audience: cfg.audience });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const j = async (path: string, init: RequestInit = {}, token?: string) => {
  const res = await fetch(API + path, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) } });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, res };
};

async function signup(name: string) {
  const email = `${name}-${Date.now()}@test.local`;
  const reg = await j('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password: 'motdepasse-solide' }) });
  assert.equal(reg.status, 201, `inscription: ${JSON.stringify(reg.body)}`);
  const login = await j('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password: 'motdepasse-solide' }) });
  assert.equal(login.status, 200, `connexion: ${JSON.stringify(login.body)}`);
  const token = login.body.token ?? login.body.data?.token;
  const id = login.body.user?.id ?? login.body.data?.user?.id;
  assert.ok(token && id, `token/id introuvables: ${Object.keys(login.body)}`);
  return { token: token as string, id: id as string };
}

async function listen(subscription: { hubUrl: string; subscribeParam: string; topics: string[]; authMode: string; token?: string }, cookieValue: string | null, ms: number) {
  const u = new URL(subscription.hubUrl);
  subscription.topics.forEach((t) => u.searchParams.append(subscription.subscribeParam, t));
  const headers: Record<string, string> = { Accept: 'text/event-stream' };
  if (subscription.authMode === 'bearer') headers.Authorization = `Bearer ${subscription.token}`;
  else headers.Cookie = `${cfg.cookieName}=${cookieValue}`;
  const ctrl = new AbortController();
  const res = await fetch(u, { headers, signal: ctrl.signal });
  assert.equal(res.status, 200, `hub a refusé l'abonnement (${res.status})`);
  const labels: string[] = [];
  const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = '';
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { for (;;) { const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true });
    for (const m of buf.matchAll(/^data: (.+)$/gm)) { try { const l = JSON.parse(m[1]).data?.label; if (l && !labels.includes(l)) labels.push(l); } catch { /* */ } } } } catch { /* abort */ } finally { clearTimeout(timer); }
  return labels;
}

let n = 0;
const publish = (target: Parameters<typeof topicFor>[1], label: string) => {
  const env: EventEnvelope = { eventId: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, type: 'chat.message', v: 1, seq: n, realmId: cfg.defaultRealmId, scope: 'x', ts: new Date().toISOString(), data: { label } };
  return publisher.publish(env, topicFor(cfg.defaultRealmId, target), target.kind !== 'table' && target.kind !== 'world' && target.kind !== 'place');
};

const gm = await signup('mj'); const player = await signup('alice'); const outsider = await signup('eve');
const room = await j('/api/rooms', { method: 'POST', body: JSON.stringify({ name: 'Table test', gmId: gm.id }) }, gm.token);
assert.equal(room.status, 201, `création room: ${JSON.stringify(room.body)}`);
const roomId = room.body.id as string;
const add = await j(`/api/rooms/${roomId}/players`, { method: 'POST', body: JSON.stringify({ userId: player.id, role: 'player' }) }, gm.token);
assert.equal(add.status, 201, `ajout joueur: ${JSON.stringify(add.body)}`);
console.log(`table ${roomId} créée, mode ${cfg.authMode}`);

// --- Contrôle d'accès de la route /session
assert.equal((await j(`/api/realtime/session?roomId=${roomId}`)).status, 401, 'sans token → 401');
assert.equal((await j(`/api/realtime/session?roomId=${roomId}`, {}, outsider.token)).status, 403, 'non-membre → 403');

assert.equal((await j('/api/realtime/session?roomId=pas-un-uuid', {}, gm.token)).status, 400, 'roomId invalide → 400');

const session = async (who: { token: string }) => {
  const r = await j(`/api/realtime/session?roomId=${roomId}`, {}, who.token);
  assert.equal(r.status, 200, `session: ${JSON.stringify(r.body)}`);
  assert.equal(r.res.headers.get('cache-control'), 'no-store');
  const setCookie = r.res.headers.getSetCookie().find((c) => c.startsWith(`${cfg.cookieName}=`));
  return { sub: r.body, cookieValue: setCookie ? setCookie.split(';')[0].split('=').slice(1).join('=') : null, setCookie };
};
const g = await session(gm); const p = await session(player);

assert.ok(g.sub.topics.some((t: string) => t.endsWith(`/table/${roomId}/gm`)), 'le MJ reçoit /gm');
assert.ok(!p.sub.topics.some((t: string) => t.endsWith('/gm')), 'le joueur ne reçoit PAS /gm');
assert.equal(g.sub.subscribeParam, subscribeParam(cfg.protocol));
if (cfg.authMode === 'cookie') {
  assert.ok(p.cookieValue, 'cookie posé');
  assert.match(p.setCookie!, /HttpOnly/i); assert.match(p.setCookie!, /Path=\/\.well-known\/mercure/); assert.match(p.setCookie!, /SameSite=Strict/i);
  assert.equal(p.sub.token, undefined, 'pas de jeton dans le corps en mode cookie');
} else {
  assert.ok(p.sub.token, 'jeton dans le corps en mode bearer'); assert.equal(p.cookieValue, null, 'pas de cookie en mode bearer');
}

// --- Jetons délivrés par le serveur, acceptés par le VRAI hub, et isolation
const pListen = listen(p.sub, p.cookieValue, 2500); const gListen = listen(g.sub, g.cookieValue, 2500);
await wait(900);
await publish({ kind: 'table', tableId: roomId }, 'public');
await publish({ kind: 'tableGm', tableId: roomId }, 'secret-mj');
await publish({ kind: 'user', userId: player.id }, 'prive-alice');
const [gotP, gotG] = await Promise.all([pListen, gListen]);
assert.deepEqual(gotP.sort(), ['prive-alice', 'public'], `joueur a reçu: ${gotP}`);
assert.deepEqual(gotG.sort(), ['public', 'secret-mj'], `MJ a reçu: ${gotG}`);
console.log(`OK (${cfg.authMode}) : joueur=${gotP.sort()} | MJ=${gotG.sort()}`);
