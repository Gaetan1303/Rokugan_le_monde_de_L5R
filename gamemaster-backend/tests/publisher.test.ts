import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { MercurePublisher, PublishError } from '../src/realtime/publisher.js';
import type { EventEnvelope } from '../src/contract/index.js';

const env: EventEnvelope = {
  eventId: '11111111-1111-4111-8111-111111111111', type: 'chat.message', v: 1, seq: 3,
  realmId: 'r', scope: 'table:t1', ts: '2026-11-20T10:00:00.000Z', data: { text: 'hai' },
};
const KEY = 'p'.repeat(40);

function fakeHub(status = 200) {
  const calls: Array<{ headers: http.IncomingHttpHeaders; body: URLSearchParams }> = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      calls.push({ headers: req.headers, body: new URLSearchParams(raw) });
      res.statusCode = status;
      res.end(status === 200 ? env.eventId : 'nope');
    });
  });
  return new Promise<{ url: string; calls: typeof calls; close: () => void }>((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({ url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/.well-known/mercure`, calls, close: () => server.close() })));
}

test('publie topic, id, type, data et JWT éditeur', async () => {
  const hub = await fakeHub();
  try {
    await new MercurePublisher({ hubUrl: hub.url, publisherKey: KEY }).publish(env, 'rokugan:/realm/r/table/t1', false);
    const c = hub.calls[0];
    assert.equal(c.body.get('topic'), 'rokugan:/realm/r/table/t1');
    assert.equal(c.body.get('id'), env.eventId);
    assert.equal(c.body.get('type'), 'chat.message');
    assert.equal(c.body.has('private'), false);
    assert.deepEqual(JSON.parse(c.body.get('data')!), env);
    const token = c.headers.authorization!.replace('Bearer ', '');
    const { header, payload } = jwt.verify(token, KEY, { complete: true }) as jwt.Jwt & { payload: any };
    assert.equal(header.typ, 'at+jwt');
    assert.equal(payload.iss, 'https://localhost');
    assert.equal(payload.aud, hub.url, 'audience = URL du hub contactée');
    assert.deepEqual(payload.authorization_details[0].actions, ['publish']);
    assert.deepEqual(payload.authorization_details[0].topics, [{ match: '*' }]);
  } finally { hub.close(); }
});

test('legacy : jeton avec claim mercure.publish', async () => {
  const hub = await fakeHub();
  try {
    await new MercurePublisher({ hubUrl: hub.url, publisherKey: KEY, protocol: 'legacy' }).publish(env, 't', false);
    const token = hub.calls[0].headers.authorization!.replace('Bearer ', '');
    const payload = jwt.verify(token, KEY) as any;
    assert.deepEqual(payload.mercure.publish, ['*']);
    assert.equal(payload.authorization_details, undefined);
  } finally { hub.close(); }
});

test('émetteur et audience configurables', async () => {
  const hub = await fakeHub();
  try {
    await new MercurePublisher({ hubUrl: hub.url, publisherKey: KEY, issuer: 'https://api.example.com', audience: 'https://pinned/.well-known/mercure' }).publish(env, 't', false);
    const payload = jwt.decode(hub.calls[0].headers.authorization!.replace('Bearer ', '')) as any;
    assert.equal(payload.iss, 'https://api.example.com');
    assert.equal(payload.aud, 'https://pinned/.well-known/mercure');
  } finally { hub.close(); }
});

test('marque private=on pour un topic privé', async () => {
  const hub = await fakeHub();
  try {
    await new MercurePublisher({ hubUrl: hub.url, publisherKey: KEY }).publish(env, 'rokugan:/realm/r/user/u1', true);
    assert.equal(hub.calls[0].body.get('private'), 'on');
  } finally { hub.close(); }
});

test('réponse non-2xx → PublishError avec le statut', async () => {
  const hub = await fakeHub(403);
  try {
    await assert.rejects(
      new MercurePublisher({ hubUrl: hub.url, publisherKey: KEY }).publish(env, 't', false),
      (e: unknown) => e instanceof PublishError && e.status === 403);
  } finally { hub.close(); }
});

test('hub injoignable → PublishError', async () => {
  await assert.rejects(
    new MercurePublisher({ hubUrl: 'http://127.0.0.1:1/x', publisherKey: KEY, timeoutMs: 500 }).publish(env, 't', false),
    PublishError);
});

test('le jeton éditeur est mis en cache', async () => {
  const hub = await fakeHub();
  try {
    const p = new MercurePublisher({ hubUrl: hub.url, publisherKey: KEY });
    await p.publish(env, 't', false);
    await p.publish(env, 't', false);
    assert.equal(hub.calls[0].headers.authorization, hub.calls[1].headers.authorization);
  } finally { hub.close(); }
});
