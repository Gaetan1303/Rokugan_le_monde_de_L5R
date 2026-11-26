import Ajv from 'ajv';
import { envelopeSchema, isEventType, EVENT_VERSIONS } from '../contract/index.js';
import type { EventEnvelope } from '../contract/index.js';

const ajv = new Ajv({ allErrors: true, strict: true });
const validateShape = ajv.compile(envelopeSchema);

export class InvalidEventError extends Error {
  constructor(public readonly details: string) {
    super(`Événement invalide : ${details}`);
    this.name = 'InvalidEventError';
  }
}

/** Valide l'enveloppe et la version connue du type. Lève InvalidEventError sinon. */
export function validateEnvelope(candidate: unknown): asserts candidate is EventEnvelope {
  if (!validateShape(candidate)) {
    throw new InvalidEventError(ajv.errorsText(validateShape.errors));
  }
  const env = candidate as EventEnvelope;
  if (!isEventType(env.type)) {
    throw new InvalidEventError(`type inconnu "${env.type}"`);
  }
  if (env.v !== EVENT_VERSIONS[env.type]) {
    throw new InvalidEventError(`version ${env.v} non prise en charge pour "${env.type}"`);
  }
}
