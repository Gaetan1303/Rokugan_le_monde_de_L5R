import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { RealtimeConfig } from './config.js';

export type MercureRole = 'publish' | 'subscribe';

export const AUTHORIZATION_DETAIL_TYPE = 'https://mercure.rocks/authorization-detail';

export interface MintParams {
  role: MercureRole;
  /** Topics autorisés (correspondance exacte). `['*']` = tous. */
  topics: string[];
  key: string;
  audience: string;
  subject: string;
  ttlSeconds: number;
}

/**
 * Fabrique un jeton pour le hub, selon le protocole configuré.
 *
 * Protocole 1.x (RFC 9068 + RFC 9396) : en-tête `typ: at+jwt`, claims `iss`, `aud`, `exp`,
 * `sub`, `client_id`, `iat`, `jti` et `authorization_details`. Un hub 1.x refuse (401) tout jeton
 * sans `typ`, `iss` de confiance ou `aud` correspondant à l'URL contactée.
 *
 * Protocole legacy (0.x) : claim `mercure: { publish | subscribe: [...] }`.
 */
export function mintToken(cfg: Pick<RealtimeConfig, 'protocol' | 'issuer'>, p: MintParams): string {
  if (cfg.protocol === 'legacy') {
    return jwt.sign({ mercure: { [p.role]: p.topics } }, p.key, {
      algorithm: 'HS256',
      expiresIn: p.ttlSeconds,
      subject: p.subject,
    });
  }
  return jwt.sign(
    {
      client_id: cfg.issuer,
      jti: `urn:uuid:${randomUUID()}`,
      authorization_details: [
        {
          type: AUTHORIZATION_DETAIL_TYPE,
          actions: [p.role],
          topics: p.topics.map((match) => ({ match })),
        },
      ],
    },
    p.key,
    {
      algorithm: 'HS256',
      header: { alg: 'HS256', typ: 'at+jwt' },
      issuer: cfg.issuer,
      audience: p.audience,
      subject: p.subject,
      expiresIn: p.ttlSeconds,
    },
  );
}
