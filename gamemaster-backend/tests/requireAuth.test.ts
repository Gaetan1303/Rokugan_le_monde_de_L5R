import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createRequireAuth } from '../src/middleware/requireAuthCore.js';
import type { AuthTokenPayload } from '../src/services/authService.js';

// Même logique que AuthService.verifyToken (jwt.verify + présence de `id`), avec une clé de test.
// Le câblage réel vers AuthService est dans middleware/requireAuth.ts (non chargé ici : TypeORM
// a besoin des métadonnées de décorateurs que tsx n'émet pas).
const SECRET = 'test-secret-with-at-least-32-characters!!';
const requireAuth = createRequireAuth((token) => {
  const decoded = jwt.verify(token, SECRET);
  if (typeof decoded === 'string' || !decoded.id) throw new Error('Payload JWT invalide');
  return decoded as AuthTokenPayload;
});

function run(authHeader?: string) {
  const req: any = { headers: authHeader ? { authorization: authHeader } : {} };
  let status = 200; let body: unknown; let nexted = false;
  const res: any = { status(c: number) { status = c; return this; }, json(b: unknown) { body = b; return this; } };
  requireAuth(req, res, () => { nexted = true; });
  return { req, status, body, nexted };
}
const sign = (secret: string, payload: object = { id: 'u1', name: 'Doji', email: 'a@b.c', role: 'joueur' }, opts: jwt.SignOptions = {}) =>
  jwt.sign(payload, secret, { expiresIn: 60, ...opts });

test('sans en-tête → 401', () => {
  const r = run();
  assert.equal(r.status, 401); assert.equal(r.nexted, false);
});

test('en-tête non Bearer → 401', () => {
  assert.equal(run('Basic abc').status, 401);
});

test('token signé avec une autre clé → 401', () => {
  const r = run(`Bearer ${sign('une-autre-cle-tout-a-fait-differente-123')}`);
  assert.equal(r.status, 401); assert.equal(r.nexted, false);
});

test('token expiré → 401', () => {
  assert.equal(run(`Bearer ${sign(SECRET, undefined, { expiresIn: -10 })}`).status, 401);
});

test('token sans identifiant → 401', () => {
  assert.equal(run(`Bearer ${sign(SECRET, { name: 'x' })}`).status, 401);
});

test('token valide → next() et req.user renseigné depuis le token', () => {
  const r = run(`Bearer ${sign(SECRET)}`);
  assert.equal(r.nexted, true);
  assert.equal(r.req.user.id, 'u1');
});

test('le message d’erreur ne révèle pas la cause', () => {
  const r = run(`Bearer ${sign('une-autre-cle-tout-a-fait-differente-123')}`);
  assert.deepEqual(r.body, { error: 'Token invalide ou expiré' });
});
