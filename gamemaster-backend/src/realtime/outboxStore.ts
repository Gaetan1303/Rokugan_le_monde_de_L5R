import type { DataSource } from 'typeorm';
import type { EventEnvelope } from '../contract/index.js';
import { rowsOf } from '../db/rows.js';

export interface ClaimedOutboxItem {
  outboxId: string;
  attempts: number;
  topic: string;
  isPrivate: boolean;
  envelope: EventEnvelope;
}

/** Accès aux lignes d'outbox. Interface séparée pour tester le dispatcher sans base. */
export interface OutboxStore {
  /** Réserve (bail) des lignes à publier, dans l'ordre. */
  claim(limit: number, leaseSeconds: number): Promise<ClaimedOutboxItem[]>;
  markPublished(outboxId: string): Promise<void>;
  /** Replanifie, ou passe en `failed` si `attempts >= maxAttempts`. */
  markFailed(outboxId: string, error: string, retryInSeconds: number, maxAttempts: number): Promise<void>;
  /** Rend la ligne disponible tout de suite, sans compter la tentative. */
  release(outboxId: string): Promise<void>;
}

/**
 * Implémentation PostgreSQL. Le bail (`status='sending'` + `lockedUntil`) évite de garder une
 * transaction ouverte pendant l'appel HTTP et permet à plusieurs instances de coexister
 * (FOR UPDATE SKIP LOCKED).
 */
export class TypeOrmOutboxStore implements OutboxStore {
  constructor(private readonly ds: DataSource) {}

  async claim(limit: number, leaseSeconds: number): Promise<ClaimedOutboxItem[]> {
    const claimed = rowsOf<{ id: string; eventId: string; topic: string; isPrivate: boolean; attempts: number }>(
      await this.ds.query(
        `UPDATE outbox SET status = 'sending',
                           "lockedUntil" = now() + make_interval(secs => $2),
                           attempts = attempts + 1
          WHERE id IN (
            SELECT id FROM outbox
             WHERE (status = 'pending' AND "nextAttemptAt" <= now())
                OR (status = 'sending' AND "lockedUntil" < now())
             ORDER BY id
             LIMIT $1
             FOR UPDATE SKIP LOCKED)
        RETURNING id, "eventId", topic, "isPrivate", attempts`,
        [limit, leaseSeconds],
      ),
    );
    if (claimed.length === 0) return [];

    const events = rowsOf<{ eventId: string; realmId: string; scope: string; seq: string; type: string; v: number; actorId: string | null; data: Record<string, unknown>; createdAt: Date }>(
      await this.ds.query(`SELECT * FROM event_log WHERE "eventId" = ANY($1::uuid[])`, [claimed.map((c) => c.eventId)]),
    );
    const byId = new Map(events.map((e) => [e.eventId, e]));

    return claimed
      .sort((a, b) => Number(a.id) - Number(b.id))
      .flatMap((c) => {
        const e = byId.get(c.eventId);
        if (!e) return []; // ne devrait pas arriver (même transaction à l'écriture)
        const envelope: EventEnvelope = {
          eventId: e.eventId,
          type: e.type,
          v: e.v,
          seq: Number(e.seq),
          realmId: e.realmId,
          scope: e.scope,
          ...(e.actorId ? { actorId: e.actorId } : {}),
          ts: new Date(e.createdAt).toISOString(),
          data: e.data,
        };
        return [{ outboxId: c.id, attempts: c.attempts, topic: c.topic, isPrivate: c.isPrivate, envelope }];
      });
  }

  async markPublished(outboxId: string): Promise<void> {
    await this.ds.query(
      `UPDATE outbox SET status = 'published', "publishedAt" = now(), "lockedUntil" = NULL, "lastError" = NULL WHERE id = $1`,
      [outboxId],
    );
  }

  async markFailed(outboxId: string, error: string, retryInSeconds: number, maxAttempts: number): Promise<void> {
    await this.ds.query(
      `UPDATE outbox
          SET status = CASE WHEN attempts >= $3 THEN 'failed' ELSE 'pending' END,
              "nextAttemptAt" = now() + make_interval(secs => $2),
              "lockedUntil" = NULL,
              "lastError" = $4
        WHERE id = $1`,
      [outboxId, retryInSeconds, maxAttempts, error.slice(0, 500)],
    );
  }

  async release(outboxId: string): Promise<void> {
    await this.ds.query(
      `UPDATE outbox SET status = 'pending', attempts = GREATEST(attempts - 1, 0), "lockedUntil" = NULL, "nextAttemptAt" = now() WHERE id = $1`,
      [outboxId],
    );
  }
}
