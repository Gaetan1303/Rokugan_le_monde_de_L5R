import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { allowedTopics, issueSubscriberToken } from '../src/realtime/subscriberToken.js';
import { loadRealtimeConfig, subscribeParam } from '../src/realtime/config.js';
import { AUTHORIZATION_DETAIL_TYPE } from '../src/realtime/tokens.js';

const SUBKEY = 'k'.repeat(40);
const env = (extra: Record<string, string> = {}) => ({
  MERCURE_URL: 'http://hub:3901/.well-known/mercure',
  MERCURE_PUBLIC_URL: 'https://hub.example.com/.well-known/mercure',
  MERCURE_PUBLISHER_JWT_KEY: 'p'.repeat(40),
  MERCURE_SUBSCRIBER_JWT_KEY: SUBKEY,
  ...extra,
}) as NodeJS.ProcessEnv;

test('un joueur ne reçoit pas le topic /gm', () => {
  const t = allowedTopics({ realmId: 'r', userId: 'u', playerTableIds: ['t1'] });
  assert.ok(t.includes('rokugan:/realm/r/table/t1'));
  assert.ok(!t.some((x) => x.endsWith('/gm')));
});

test('un MJ reçoit la table et son canal /gm', () => {
  const t = allowedTopics({ realmId: 'r', userId: 'u', gmTableIds: ['t1'] });
  assert.ok(t.includes('rokugan:/realm/r/table/t1'));
  assert.ok(t.includes('rokugan:/realm/r/table/t1/gm'));
});

test('un utilisateur ne reçoit jamais le topic privé d’un autre', () => {
  const t = allowedTopics({ realmId: 'r', userId: 'u1' });
  assert.ok(t.includes('rokugan:/realm/r/user/u1'));
  assert.ok(!t.includes('rokugan:/realm/r/user/u2'));
  assert.ok(!t.includes('rokugan:/admin'));
});

test('identifiant de table malveillant refusé', () => {
  assert.throws(() => allowedTopics({ realmId: 'r', userId: 'u', playerTableIds: ['x/../admin'] }));
});

test('Mercure 1.x : jeton at+jwt avec iss, aud (URL publique), exp, sub, jti et authorization_details', () => {
  const cfg = loadRealtimeConfig(env({ MERCURE_ISSUER: 'https://api.example.com' }))!;
  const issued = issueSubscriberToken(cfg, { realmId: 'r', userId: 'u', playerTableIds: ['t1'] });
  const { header, payload } = jwt.verify(issued.token, SUBKEY, { complete: true }) as jwt.Jwt & { payload: any };
  assert.equal(header.typ, 'at+jwt');
  assert.equal(header.alg, 'HS256');
  assert.equal(payload.iss, 'https://api.example.com');
  assert.equal(payload.aud, 'https://hub.example.com/.well-known/mercure'); // URL contactée par le navigateur
  assert.equal(payload.sub, 'u');
  assert.equal(payload.client_id, 'https://api.example.com');
  assert.ok(payload.jti.startsWith('urn:uuid:'));
  assert.equal(payload.exp - payload.iat, 900);
  const detail = payload.authorization_details[0];
  assert.equal(detail.type, AUTHORIZATION_DETAIL_TYPE);
  assert.deepEqual(detail.actions, ['subscribe']);
  assert.deepEqual(detail.topics.map((t: { match: string }) => t.match), issued.topics);
  assert.equal(payload.mercure, undefined, 'pas de claim legacy en 1.x');
  assert.throws(() => jwt.verify(issued.token, 'autre-cle'));
});

test('MERCURE_AUDIENCE force l’audience', () => {
  const cfg = loadRealtimeConfig(env({ MERCURE_AUDIENCE: 'https://pinned.example.com/.well-known/mercure' }))!;
  const p = jwt.decode(issueSubscriberToken(cfg, { realmId: 'r', userId: 'u' }).token) as any;
  assert.equal(p.aud, 'https://pinned.example.com/.well-known/mercure');
});

test('legacy 0.x : claim mercure.subscribe, sans typ at+jwt', () => {
  const cfg = loadRealtimeConfig(env({ MERCURE_PROTOCOL: 'legacy' }))!;
  const issued = issueSubscriberToken(cfg, { realmId: 'r', userId: 'u', playerTableIds: ['t1'] });
  const { header, payload } = jwt.verify(issued.token, SUBKEY, { complete: true }) as jwt.Jwt & { payload: any };
  assert.notEqual(header.typ, 'at+jwt');
  assert.deepEqual(payload.mercure.subscribe, issued.topics);
  assert.equal(payload.authorization_details, undefined);
});

test('paramètre d’abonnement selon le protocole', () => {
  assert.equal(subscribeParam('1'), 'match');
  assert.equal(subscribeParam('legacy'), 'topic');
});

test('config : désactivée sans MERCURE_URL', () => {
  assert.equal(loadRealtimeConfig({} as NodeJS.ProcessEnv), null);
});

test('config : clés obligatoires, distinctes, longues en production', () => {
  const base = { MERCURE_URL: 'http://h/.well-known/mercure' };
  assert.throws(() => loadRealtimeConfig(base as NodeJS.ProcessEnv), /requis/);
  assert.throws(() => loadRealtimeConfig({ ...base, MERCURE_PUBLISHER_JWT_KEY: 'a', MERCURE_SUBSCRIBER_JWT_KEY: 'a' } as NodeJS.ProcessEnv), /différentes/);
  assert.throws(() => loadRealtimeConfig({ ...base, NODE_ENV: 'production', MERCURE_PUBLISHER_JWT_KEY: 'court', MERCURE_SUBSCRIBER_JWT_KEY: 'autre' } as NodeJS.ProcessEnv), /32/);
});

test('config : MERCURE_ISSUER obligatoire en production (1.x)', () => {
  const prod = { MERCURE_URL: 'https://h/.well-known/mercure', NODE_ENV: 'production', MERCURE_PUBLISHER_JWT_KEY: 'p'.repeat(40), MERCURE_SUBSCRIBER_JWT_KEY: 's'.repeat(40) };
  assert.throws(() => loadRealtimeConfig(prod as NodeJS.ProcessEnv), /MERCURE_ISSUER/);
  assert.ok(loadRealtimeConfig({ ...prod, MERCURE_ISSUER: 'https://api.example.com' } as NodeJS.ProcessEnv));
  assert.ok(loadRealtimeConfig({ ...prod, MERCURE_PROTOCOL: 'legacy' } as NodeJS.ProcessEnv), 'legacy n’exige pas d’issuer');
});

test('config : cookie — noms par défaut selon le contexte', () => {
  const dev = loadRealtimeConfig(env())!;
  assert.equal(dev.cookieName, 'mercure_access_token');
  assert.equal(dev.cookieSecure, false);
  const prod = loadRealtimeConfig(env({ NODE_ENV: 'production', MERCURE_ISSUER: 'https://api.example.com' }))!;
  assert.equal(prod.cookieName, '__Secure-mercure_access_token');
  assert.equal(prod.cookieSecure, true);
  assert.equal(prod.cookieSameSite, 'strict');
  assert.equal(loadRealtimeConfig(env({ MERCURE_PROTOCOL: 'legacy' }))!.cookieName, 'mercureAuthorization');
  assert.equal(dev.authMode, 'cookie');
  assert.equal(loadRealtimeConfig(env({ MERCURE_AUTH_MODE: 'bearer' }))!.authMode, 'bearer');
});
