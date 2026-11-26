import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectStartupWarnings, isHosted } from '../src/startupChecks.js';

const env = (e: Record<string, string> = {}) => e as NodeJS.ProcessEnv;

test('poste local de développement : aucun avertissement', () => {
  assert.deepEqual(collectStartupWarnings(env()), []);
});

test('hébergé sans NODE_ENV=production ni JWT_SECRET : deux avertissements (le cas du journal Render)', () => {
  const w = collectStartupWarnings(env({ RENDER: 'true' }));
  assert.equal(w.length, 2);
  assert.match(w[0], /NODE_ENV/);
  assert.match(w[1], /JWT_SECRET/);
});

test('hébergé correctement configuré : aucun avertissement', () => {
  assert.deepEqual(collectStartupWarnings(env({ RENDER: 'true', NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40) })), []);
});

test('détection des hébergeurs courants', () => {
  for (const k of ['RENDER', 'DYNO', 'FLY_APP_NAME', 'RAILWAY_ENVIRONMENT', 'VERCEL']) assert.equal(isHosted(env({ [k]: '1' })), true, k);
  assert.equal(isHosted(env()), false);
});
