import { randomUUID } from 'node:crypto';
import type { EntityManager } from 'typeorm';
import { EventLog } from '../models/EventLog.js';
import { Outbox } from '../models/Outbox.js';
import { EVENT_VERSIONS, isPrivateTarget, scopeOf, topicFor } from '../contract/index.js';
import type { EventDataMap, EventEnvelope, EventTarget, EventType, TypedEvent } from '../contract/index.js';
import { validateEnvelope } from '../realtime/validateEvent.js';
import { rowsOf } from '../db/rows.js';

export interface AppendEventInput<T extends EventType> {
  realmId: string;
  type: T;
  data: EventDataMap[T]['data'];
  /**
   * Destinataires. Le PREMIER définit la portée de la séquence (`seq`) ;
   * chaque cible produit une ligne d'outbox.
   */
  targets: [EventTarget, ...EventTarget[]];
  actorId?: string;
  eventId?: string;
  at?: Date;
}

/**
 * Écrit un événement dans le journal ET dans l'outbox, avec un `seq` strictement croissant
 * par (royaume, portée).
 *
 * IMPORTANT : à appeler avec le `manager` de la transaction qui modifie l'état du jeu :
 *
 *   await AppDataSource.transaction(async (m) => {
 *     await m.save(character);                          // changement d'état
 *     await appendEvent(m, { ... });                    // même transaction
 *   });
 *
 * Ainsi un événement n'existe que si le changement d'état a été validé, et inversement.
 */
export async function appendEvent<T extends EventType>(
  manager: EntityManager,
  input: AppendEventInput<T>,
): Promise<TypedEvent<T>> {
  const scope = scopeOf(input.targets[0]);

  // Incrément atomique : le verrou de ligne sérialise les écritures concurrentes d'une même portée.
  const rows = rowsOf<{ last: string }>(await manager.query(
    `INSERT INTO event_sequence ("realmId", "scope", "last") VALUES ($1, $2, 1)
     ON CONFLICT ("realmId", "scope") DO UPDATE SET "last" = event_sequence."last" + 1
     RETURNING "last"`,
    [input.realmId, scope],
  ));
  const seq = Number(rows[0].last);

  const envelope: EventEnvelope = {
    eventId: input.eventId ?? randomUUID(),
    type: input.type,
    v: EVENT_VERSIONS[input.type],
    seq,
    realmId: input.realmId,
    scope,
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ts: (input.at ?? new Date()).toISOString(),
    data: input.data as unknown as Record<string, unknown>,
  };
  validateEnvelope(envelope);

  await manager.insert(EventLog, {
    eventId: envelope.eventId,
    realmId: envelope.realmId,
    scope: envelope.scope,
    seq: envelope.seq,
    type: envelope.type,
    v: envelope.v,
    actorId: envelope.actorId ?? null,
    // jsonb : le typage profond de TypeORM ne sait pas exprimer un objet libre.
    data: envelope.data as any,
  });

  await manager.insert(
    Outbox,
    input.targets.map((target) => ({
      eventId: envelope.eventId,
      topic: topicFor(input.realmId, target),
      isPrivate: isPrivateTarget(target),
    })),
  );

  return envelope as unknown as TypedEvent<T>;
}
