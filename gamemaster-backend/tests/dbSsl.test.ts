import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideDbSsl, withoutSslParams } from '../src/dbSsl.js';

const URL = 'postgresql://u:p@host:5432/db';
const env = (e: Record<string, string> = {}) => e as NodeJS.ProcessEnv;

test('local sans rien : TLS désactivé', () => {
  assert.equal(decideDbSsl(URL, env()).enabled, false);
});

test('NODE_ENV=production : TLS activé', () => {
  const d = decideDbSsl(URL, env({ NODE_ENV: 'production' }));
  assert.equal(d.enabled, true);
  assert.equal(d.reason, 'NODE_ENV=production');
});

test('le cas Render : NODE_ENV absent + DATABASE_SSL=true → TLS activé', () => {
  assert.equal(decideDbSsl(URL, env({ DATABASE_SSL: 'true' })).enabled, true);
});

test('sslmode dans l’URL suffit, sans variable ni NODE_ENV', () => {
  for (const q of ['?sslmode=require', '?sslmode=verify-full', '?a=1&sslmode=verify-ca', '?ssl=true']) {
    assert.equal(decideDbSsl(URL + q, env()).enabled, true, q);
  }
  assert.equal(decideDbSsl(URL + '?sslmode=disable', env()).enabled, false);
  assert.equal(decideDbSsl(URL + '?sslmode=prefer', env()).enabled, false);
});

test('DATABASE_SSL=false est respecté, même en production (réseau Docker interne)', () => {
  assert.equal(decideDbSsl(URL, env({ NODE_ENV: 'production', DATABASE_SSL: 'false' })).enabled, false);
  assert.equal(decideDbSsl(URL + '?sslmode=require', env({ DATABASE_SSL: 'off' })).enabled, false);
});

test('valeurs de DATABASE_SSL tolérantes (casse, espaces, synonymes)', () => {
  for (const v of ['TRUE', ' true ', '1', 'yes', 'on', 'require']) assert.equal(decideDbSsl(URL, env({ DATABASE_SSL: v })).enabled, true, v);
  for (const v of ['FALSE', '0', 'no', 'disable']) assert.equal(decideDbSsl(URL, env({ NODE_ENV: 'production', DATABASE_SSL: v })).enabled, false, v);
});

test('vérification du certificat : désactivée par défaut, activable', () => {
  assert.equal(decideDbSsl(URL, env({ DATABASE_SSL: 'true' })).rejectUnauthorized, false);
  assert.equal(decideDbSsl(URL, env({ DATABASE_SSL: 'true', DATABASE_SSL_REJECT_UNAUTHORIZED: 'true' })).rejectUnauthorized, true);
});

test('sslmode=disable dans l’URL est respecté, même en production', () => {
  assert.equal(decideDbSsl(URL + '?sslmode=disable', env({ NODE_ENV: 'production' })).enabled, false);
  assert.equal(decideDbSsl(URL + '?sslmode=disable', env({ DATABASE_SSL: 'true' })).enabled, true, 'la variable explicite gagne');
});

test('withoutSslParams retire uniquement les paramètres TLS', () => {
  assert.equal(withoutSslParams('postgresql://u:p@h:5432/db'), 'postgresql://u:p@h:5432/db');
  assert.equal(withoutSslParams('postgresql://u:p@h/db?sslmode=require'), 'postgresql://u:p@h/db');
  assert.equal(withoutSslParams('postgresql://u:p@h/db?sslmode=require&application_name=rokugan'), 'postgresql://u:p@h/db?application_name=rokugan');
  assert.equal(withoutSslParams('postgresql://u:p@h/db?connect_timeout=5&ssl=true&SSLMODE=verify-full'), 'postgresql://u:p@h/db?connect_timeout=5');
});

test('withoutSslParams conserve un mot de passe encodé', () => {
  assert.equal(withoutSslParams('postgresql://u:p%40ss%3F@h/db?sslmode=require'), 'postgresql://u:p%40ss%3F@h/db');
});
