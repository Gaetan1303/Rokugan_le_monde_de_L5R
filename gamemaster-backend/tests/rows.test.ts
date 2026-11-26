import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rowsOf } from '../src/db/rows.js';

test('rowsOf : SELECT / INSERT renvoient les lignes telles quelles', () => {
  assert.deepEqual(rowsOf([{ a: 1 }, { a: 2 }]), [{ a: 1 }, { a: 2 }]);
  assert.deepEqual(rowsOf([]), []);
});

test('rowsOf : UPDATE/DELETE … RETURNING renvoient [lignes, nombre]', () => {
  assert.deepEqual(rowsOf([[{ id: '1' }, { id: '2' }], 2]), [{ id: '1' }, { id: '2' }]);
  assert.deepEqual(rowsOf([[], 0]), []);
});

test('rowsOf : une valeur inattendue donne un tableau vide', () => {
  assert.deepEqual(rowsOf(undefined), []);
  assert.deepEqual(rowsOf(null), []);
  assert.deepEqual(rowsOf({}), []);
});
