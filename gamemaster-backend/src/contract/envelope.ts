/**
 * Contrat d'événements Rokugan : enveloppe commune.
 *
 * Ce dossier ne doit importer AUCUN module Node ou framework : il est conçu pour
 * être extrait tel quel dans un paquet partagé (@rokugan/contract) utilisé aussi
 * par le front.
 */

/** Version du format d'enveloppe. À incrémenter en cas de rupture. */
export const ENVELOPE_VERSION = 1;

export interface EventEnvelope<TType extends string = string, TData = unknown> {
  /** UUID unique ; sert d'`id` Mercure (reprise via Last-Event-ID) et de clé de dédoublonnage. */
  eventId: string;
  /** Type d'événement, ex. `dice.rolled`. */
  type: TType;
  /** Version du schéma de `data` pour ce type. */
  v: number;
  /** Numéro de séquence croissant, par portée (voir `scopeOf`). Permet de détecter les trous. */
  seq: number;
  /** Royaume (instance de monde) auquel l'événement appartient. */
  realmId: string;
  /** Portée de la séquence, ex. `table:<id>`, `user:<id>`, `world`. */
  scope: string;
  /** Auteur de l'action, si applicable. */
  actorId?: string;
  /** Horodatage ISO 8601 (UTC). */
  ts: string;
  data: TData;
}

/** JSON Schema de l'enveloppe (utilisé par `realtime/validateEvent.ts`). */
export const envelopeSchema = {
  $id: 'https://rokugan.local/schemas/event-envelope.json',
  type: 'object',
  required: ['eventId', 'type', 'v', 'seq', 'realmId', 'scope', 'ts', 'data'],
  additionalProperties: false,
  properties: {
    eventId: { type: 'string', minLength: 8, maxLength: 64 },
    type: { type: 'string', pattern: '^[a-z]+(\\.[a-z_]+)+$' },
    v: { type: 'integer', minimum: 1 },
    seq: { type: 'integer', minimum: 1 },
    realmId: { type: 'string', minLength: 1, maxLength: 64 },
    scope: { type: 'string', minLength: 1, maxLength: 128 },
    actorId: { type: 'string', minLength: 1, maxLength: 64 },
    ts: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$' },
    data: { type: 'object' },
  },
} as const;
