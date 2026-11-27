import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeDbTarget, dbErrorHints, formatDbError, initializeWithRetry } from '../src/dbDiagnostics.js';

test('describeDbTarget : hôte, port et base, jamais les identifiants', () => {
  assert.equal(describeDbTarget('postgresql://user:s3cret@db.example.com:5432/rokugan'), 'db.example.com:5432/rokugan');
  assert.equal(describeDbTarget('postgres://u:p@host/db?sslmode=require'), 'host/db');
  assert.equal(describeDbTarget('postgresql://u:p%40ss%3F@h:6543/postgres'), 'h:6543/postgres');
  assert.equal(describeDbTarget(undefined), '(DATABASE_URL non défini)');
  assert.equal(describeDbTarget('n importe quoi'), '(URL illisible)');
});

test('le rapport ne contient jamais le mot de passe', () => {
  const url = 'postgresql://admin:Tr0ub4dor&3@db.example.com:5432/rokugan';
  const text = formatDbError(new Error('password authentication failed for user "admin"'), url, 'activé').join('\n');
  assert.ok(!text.includes('Tr0ub4dor'));
  assert.match(text, /db\.example\.com:5432\/rokugan/);
});

test('« Connection terminated unexpectedly » : pistes utiles', () => {
  const h = dbErrorHints(new Error('Connection terminated unexpectedly'));
  assert.equal(h.length, 1);
  assert.match(h[0], /en pause|liste d'accès/);
});

test('pistes par type d’erreur', () => {
  const code = (c: string, message = 'x') => Object.assign(new Error(message), { code: c });
  assert.match(dbErrorHints(code('ECONNREFUSED')).join(), /Rien n'écoute/);
  assert.match(dbErrorHints(code('ENOTFOUND')).join(), /introuvable/);
  assert.match(dbErrorHints(code('ETIMEDOUT')).join(), /Délai/);
  assert.match(dbErrorHints(code('28P01', 'password authentication failed')).join(), /mot de passe/);
  assert.match(dbErrorHints(new Error('self-signed certificate')).join(), /DATABASE_SSL_REJECT_UNAUTHORIZED/);
  assert.match(dbErrorHints(new Error('SSL/TLS required')).join(), /DATABASE_SSL=true/);
  assert.match(dbErrorHints(new Error('The server does not support SSL connections')).join(), /DATABASE_SSL=false/);
  assert.deepEqual(dbErrorHints(new Error('quelque chose d’inconnu')), []);
});

test('pas de ligne « Cause » quand il n’y a pas de cause', () => {
  const text = formatDbError(new Error('Connection terminated unexpectedly'), 'postgresql://u:p@h/db', 'activé').join('\n');
  assert.doesNotMatch(text, /^Cause :/m);
  assert.ok(!text.includes('undefined'));
});

test('hôte localhost en production : avertissement', () => {
  const prev = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
  try { assert.match(dbErrorHints(new Error('x'), 'postgresql://u:p@localhost:5432/db').join(), /conteneur du serveur/); }
  finally { process.env.NODE_ENV = prev; }
});

test('la cause (err.cause) est prise en compte', () => {
  const err = new Error('échec', { cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }) });
  assert.match(dbErrorHints(err).join(), /Rien n'écoute/);
  assert.match(formatDbError(err, 'postgresql://u:p@h/db', 'désactivé').join('\n'), /Cause : connect ECONNREFUSED/);
});

test('initializeWithRetry : réussit après quelques échecs, avec délais croissants', async () => {
  let calls = 0; const waits: number[] = [];
  await initializeWithRetry({ initialize: async () => { if (++calls < 3) throw new Error('pas prête'); } },
    { attempts: 5, delayMs: 1000, sleep: async (ms) => { waits.push(ms); } });
  assert.equal(calls, 3);
  assert.deepEqual(waits, [1000, 2000]);
});

test('initializeWithRetry : renvoie la dernière erreur après épuisement', async () => {
  let calls = 0; const seen: number[] = [];
  await assert.rejects(
    initializeWithRetry({ initialize: async () => { calls++; throw new Error(`échec ${calls}`); } },
      { attempts: 3, sleep: async () => {}, onRetry: (_e, a) => seen.push(a) }),
    /échec 3/);
  assert.equal(calls, 3);
  assert.deepEqual(seen, [1, 2]);
});

test('initializeWithRetry : délai plafonné', async () => {
  const waits: number[] = [];
  await assert.rejects(initializeWithRetry({ initialize: async () => { throw new Error('x'); } },
    { attempts: 6, delayMs: 5000, maxDelayMs: 12000, sleep: async (ms) => { waits.push(ms); } }));
  assert.deepEqual(waits, [5000, 10000, 12000, 12000, 12000]);
});

test('une seule tentative : pas d’attente', async () => {
  await assert.rejects(initializeWithRetry({ initialize: async () => { throw new Error('x'); } }, { attempts: 1, sleep: async () => { assert.fail('ne doit pas attendre'); } }));
});
