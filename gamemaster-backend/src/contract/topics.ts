/**
 * Topics Mercure (IRI). Un seul endroit pour les construire : le backend s'en sert pour
 * publier et pour générer les claims d'abonnement, le front pour s'abonner.
 *
 *   rokugan:/realm/{r}/world               état du monde, annonces (public au royaume)
 *   rokugan:/realm/{r}/clan/{c}            privé : information réservée à un clan
 *   rokugan:/realm/{r}/table/{t}           public à la table : chat, jets, scène
 *   rokugan:/realm/{r}/table/{t}/gm        privé : MJ uniquement (jets cachés, notes)
 *   rokugan:/realm/{r}/place/{p}           chat de lieu, présence, bruit perçu
 *   rokugan:/realm/{r}/user/{u}            privé : lettres, rumeurs, notifications
 *   rokugan:/admin                         privé : administration
 */

const PREFIX = 'rokugan:/';

/** Les identifiants sont réduits à un jeu de caractères sûr pour éviter l'injection de topic. */
export function safeId(id: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    throw new Error(`Identifiant de topic invalide: "${id}"`);
  }
  return id;
}

export const topics = {
  world: (realmId: string) => `${PREFIX}realm/${safeId(realmId)}/world`,
  clan: (realmId: string, clanId: string) => `${PREFIX}realm/${safeId(realmId)}/clan/${safeId(clanId)}`,
  table: (realmId: string, tableId: string) => `${PREFIX}realm/${safeId(realmId)}/table/${safeId(tableId)}`,
  tableGm: (realmId: string, tableId: string) => `${PREFIX}realm/${safeId(realmId)}/table/${safeId(tableId)}/gm`,
  place: (realmId: string, placeId: string) => `${PREFIX}realm/${safeId(realmId)}/place/${safeId(placeId)}`,
  user: (realmId: string, userId: string) => `${PREFIX}realm/${safeId(realmId)}/user/${safeId(userId)}`,
  admin: () => `${PREFIX}admin`,
} as const;

/** À qui s'adresse un événement. Le backend en déduit le topic ET le caractère privé. */
export type EventTarget =
  | { kind: 'world' }
  | { kind: 'clan'; clanId: string }
  | { kind: 'table'; tableId: string }
  | { kind: 'tableGm'; tableId: string }
  | { kind: 'place'; placeId: string }
  | { kind: 'user'; userId: string }
  | { kind: 'admin' };

/** Un topic est privé dès qu'il ne doit pas être lisible par tout abonné du royaume. */
export function isPrivateTarget(target: EventTarget): boolean {
  return target.kind !== 'world' && target.kind !== 'place' && target.kind !== 'table';
}

export function topicFor(realmId: string, target: EventTarget): string {
  switch (target.kind) {
    case 'world': return topics.world(realmId);
    case 'clan': return topics.clan(realmId, target.clanId);
    case 'table': return topics.table(realmId, target.tableId);
    case 'tableGm': return topics.tableGm(realmId, target.tableId);
    case 'place': return topics.place(realmId, target.placeId);
    case 'user': return topics.user(realmId, target.userId);
    case 'admin': return topics.admin();
  }
}

/** Portée de séquence : une séquence par table, par utilisateur, par lieu, etc. */
export function scopeOf(target: EventTarget): string {
  switch (target.kind) {
    case 'world': return 'world';
    case 'clan': return `clan:${safeId(target.clanId)}`;
    case 'table':
    case 'tableGm': return `table:${safeId(target.tableId)}`; // /gm partage la séquence de la table
    case 'place': return `place:${safeId(target.placeId)}`;
    case 'user': return `user:${safeId(target.userId)}`;
    case 'admin': return 'admin';
  }
}
