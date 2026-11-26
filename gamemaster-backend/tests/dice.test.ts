import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollAndKeep, normalizePool, L5R_4E, toDiceRolledData } from '../src/rules/dice.js';
import { seededRng, cryptoRng } from '../src/rules/rng.js';
import type { Rng } from '../src/rules/rng.js';

/** RNG scripté : renvoie les valeurs dans l'ordre. */
const scripted = (values: number[]): Rng => {
  let i = 0;
  return { int: () => { if (i >= values.length) throw new Error('RNG épuisé'); return values[i++]; } };
};

test('garde les meilleurs dés', () => {
  const r = rollAndKeep({ rolled: 4, kept: 2 }, scripted([3, 9, 5, 7]));
  assert.equal(r.total, 16);
  assert.deepEqual(r.dice.map((d) => d.kept), [false, true, false, true]);
});

test('un 10 explose et s’additionne', () => {
  const r = rollAndKeep({ rolled: 2, kept: 1 }, scripted([10, 7, 4]));
  assert.deepEqual(r.dice[0].faces, [10, 7]);
  assert.equal(r.dice[0].value, 17);
  assert.equal(r.total, 17);
});

test('explosions en chaîne', () => {
  const r = rollAndKeep({ rolled: 1, kept: 1 }, scripted([10, 10, 3]));
  assert.equal(r.total, 23);
});

test('explode:false désactive l’explosion (jet sans compétence)', () => {
  const r = rollAndKeep({ rolled: 1, kept: 1, explode: false }, scripted([10]));
  assert.equal(r.total, 10);
  assert.deepEqual(r.dice[0].faces, [10]);
});

test('spécialisation : un 1 initial est relancé une fois', () => {
  const r = rollAndKeep({ rolled: 1, kept: 1, emphasis: true }, scripted([1, 6]));
  assert.equal(r.total, 6);
  assert.deepEqual(r.dice[0].faces, [1, 6]);
});

test('TN, succès et relances (raises)', () => {
  const ok = rollAndKeep({ rolled: 3, kept: 2, tn: 15 }, scripted([9, 8, 2]));
  assert.equal(ok.total, 17);
  assert.equal(ok.success, true);
  assert.equal(ok.raises, 0);
  const raised = rollAndKeep({ rolled: 3, kept: 2, tn: 5 }, scripted([9, 8, 2]));
  assert.equal(raised.raises, 2); // (17-5)/5 = 2
  const fail = rollAndKeep({ rolled: 2, kept: 1, tn: 20 }, scripted([4, 3]));
  assert.equal(fail.success, false);
  assert.equal(fail.raises, 0);
});

test('le modificateur s’ajoute au total', () => {
  const r = rollAndKeep({ rolled: 1, kept: 1, modifier: -3 }, scripted([8]));
  assert.equal(r.total, 5);
});

test('plafonds : surplus de dés lancés converti en dés gardés', () => {
  assert.deepEqual(normalizePool(12, 3), { rolled: 10, kept: 4, bonus: 0 });
  assert.deepEqual(normalizePool(14, 3), { rolled: 10, kept: 5, bonus: 0 });
});

test('plafonds : surplus de dés gardés converti en bonus', () => {
  assert.deepEqual(normalizePool(10, 12), { rolled: 10, kept: 10, bonus: 4 });
});

test('kept ne dépasse jamais rolled', () => {
  assert.deepEqual(normalizePool(2, 5), { rolled: 2, kept: 2, bonus: 0 });
});

test('entrées invalides rejetées', () => {
  for (const bad of [{ rolled: 0, kept: 1 }, { rolled: 1, kept: 0 }, { rolled: 1.5, kept: 1 }, { rolled: 500, kept: 1 }, { rolled: 1, kept: 1, tn: -1 }]) {
    assert.throws(() => rollAndKeep(bad, scripted([1])), RangeError);
  }
});

test('même graine, mêmes jets (rejouable)', () => {
  const a = rollAndKeep({ rolled: 6, kept: 3, tn: 20 }, seededRng('combat-42'));
  const b = rollAndKeep({ rolled: 6, kept: 3, tn: 20 }, seededRng('combat-42'));
  assert.deepEqual(a, b);
  const c = rollAndKeep({ rolled: 6, kept: 3, tn: 20 }, seededRng('combat-43'));
  assert.notDeepEqual(a, c);
});

test('cryptoRng reste dans les bornes', () => {
  for (let i = 0; i < 2000; i++) {
    const v = cryptoRng.int(1, L5R_4E.sides);
    assert.ok(Number.isInteger(v) && v >= 1 && v <= 10);
  }
});

test('distribution du d10 seedé grossièrement uniforme', () => {
  const rng = seededRng('stat');
  const counts = new Array(10).fill(0);
  for (let i = 0; i < 20000; i++) counts[rng.int(1, 10) - 1]++;
  for (const c of counts) assert.ok(c > 1700 && c < 2300, `compte hors plage: ${c}`);
});

test('toDiceRolledData produit un payload conforme', () => {
  const res = rollAndKeep({ rolled: 3, kept: 2, tn: 10, modifier: 2 }, scripted([9, 8, 2]));
  const data = toDiceRolledData(res, { rollId: 'r1', hidden: true, label: 'Kenjutsu' });
  assert.equal(data.hidden, true);
  assert.equal(data.total, 19);
  assert.equal(data.success, true);
  assert.equal(data.label, 'Kenjutsu');
});
