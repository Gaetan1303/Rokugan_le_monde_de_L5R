import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topics, topicFor, scopeOf, isPrivateTarget, safeId } from '../src/contract/index.js';

test('topics bien formés', () => {
  assert.equal(topics.table('r1', 't1'), 'rokugan:/realm/r1/table/t1');
  assert.equal(topics.tableGm('r1', 't1'), 'rokugan:/realm/r1/table/t1/gm');
  assert.equal(topics.admin(), 'rokugan:/admin');
});

test('identifiants dangereux refusés', () => {
  for (const bad of ['', 'a/b', '../x', 'a b', 'x?y=1', 'a'.repeat(65), 'é']) {
    assert.throws(() => safeId(bad), /invalide/);
  }
});

test('visibilité : privé = tout sauf monde, lieu, table', () => {
  assert.equal(isPrivateTarget({ kind: 'world' }), false);
  assert.equal(isPrivateTarget({ kind: 'place', placeId: 'p' }), false);
  assert.equal(isPrivateTarget({ kind: 'table', tableId: 't' }), false);
  assert.equal(isPrivateTarget({ kind: 'tableGm', tableId: 't' }), true);
  assert.equal(isPrivateTarget({ kind: 'user', userId: 'u' }), true);
  assert.equal(isPrivateTarget({ kind: 'clan', clanId: 'c' }), true);
  assert.equal(isPrivateTarget({ kind: 'admin' }), true);
});

test('la séquence de la table est partagée avec son canal /gm', () => {
  assert.equal(scopeOf({ kind: 'table', tableId: 't' }), scopeOf({ kind: 'tableGm', tableId: 't' }));
  assert.notEqual(scopeOf({ kind: 'user', userId: 'a' }), scopeOf({ kind: 'user', userId: 'b' }));
});

test('topicFor reflète la cible', () => {
  assert.equal(topicFor('r', { kind: 'user', userId: 'u1' }), 'rokugan:/realm/r/user/u1');
});
