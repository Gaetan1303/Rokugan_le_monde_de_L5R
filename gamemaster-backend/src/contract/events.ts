import type { EventEnvelope } from './envelope.js';

/**
 * Catalogue des événements. Chaque entrée associe un type à la forme de `data` et à sa version.
 * Ajouter un événement = l'ajouter ici ; le reste du code s'appuie sur ces types.
 */

export interface DiceRolledData {
  rollId: string;
  characterId?: string;
  label?: string;
  rolled: number;
  kept: number;
  /** Chaque dé avec sa chaîne d'explosions, ex. [10, 7] vaut 17. */
  dice: Array<{ faces: number[]; value: number; kept: boolean }>;
  modifier: number;
  total: number;
  tn?: number;
  success?: boolean;
  raises?: number;
  /** Jet réservé au MJ : publié sur le topic `/gm`. */
  hidden: boolean;
}

export interface ChatMessageData {
  messageId: string;
  authorId: string;
  authorName: string;
  channel: 'in_character' | 'out_of_character';
  text: string;
}

export interface SceneChangedData {
  sceneIndex: number;
  title?: string;
}

export interface TablePresenceData {
  userId: string;
  userName: string;
}

export interface WorldPausedData {
  reason: string;
  scope: 'realm' | 'place' | 'arc';
}

export interface EventDataMap {
  'dice.rolled': { v: 1; data: DiceRolledData };
  'chat.message': { v: 1; data: ChatMessageData };
  'scene.changed': { v: 1; data: SceneChangedData };
  'table.joined': { v: 1; data: TablePresenceData };
  'table.left': { v: 1; data: TablePresenceData };
  'world.paused': { v: 1; data: WorldPausedData };
  'world.resumed': { v: 1; data: { scope: 'realm' | 'place' | 'arc' } };
}

export type EventType = keyof EventDataMap;

export type TypedEvent<T extends EventType = EventType> = T extends EventType
  ? EventEnvelope<T, EventDataMap[T]['data']>
  : never;

/** Version courante de chaque type, pour `appendEvent`. */
export const EVENT_VERSIONS: { [K in EventType]: EventDataMap[K]['v'] } = {
  'dice.rolled': 1,
  'chat.message': 1,
  'scene.changed': 1,
  'table.joined': 1,
  'table.left': 1,
  'world.paused': 1,
  'world.resumed': 1,
};

export const EVENT_TYPES = Object.keys(EVENT_VERSIONS) as EventType[];

export function isEventType(value: string): value is EventType {
  return Object.prototype.hasOwnProperty.call(EVENT_VERSIONS, value);
}
