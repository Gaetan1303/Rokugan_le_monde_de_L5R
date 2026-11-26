import { topics } from '../contract/index.js';
import type { RealtimeConfig } from './config.js';
import { subscriberAudience } from './config.js';
import { mintToken } from './tokens.js';

export interface SubscriberContext {
  realmId: string;
  userId: string;
  /** Tables dont l'utilisateur est membre. */
  playerTableIds?: string[];
  /** Tables dont l'utilisateur est MJ (ajoute le topic /gm). */
  gmTableIds?: string[];
  placeIds?: string[];
  clanId?: string;
}

/**
 * Liste des topics qu'un utilisateur a le droit de lire. C'est la SEULE source d'autorisation :
 * un topic absent d'ici n'est jamais livré, même si un client modifié s'y abonne.
 */
export function allowedTopics(ctx: SubscriberContext): string[] {
  const list = [topics.world(ctx.realmId), topics.user(ctx.realmId, ctx.userId)];
  for (const t of ctx.playerTableIds ?? []) list.push(topics.table(ctx.realmId, t));
  for (const t of ctx.gmTableIds ?? []) list.push(topics.table(ctx.realmId, t), topics.tableGm(ctx.realmId, t));
  for (const p of ctx.placeIds ?? []) list.push(topics.place(ctx.realmId, p));
  if (ctx.clanId) list.push(topics.clan(ctx.realmId, ctx.clanId));
  return [...new Set(list)];
}

export interface IssuedSubscription {
  token: string;
  topics: string[];
  expiresAt: Date;
}

export function issueSubscriberToken(
  cfg: Pick<RealtimeConfig, 'subscriberKey' | 'subscriberTtlSeconds' | 'protocol' | 'issuer' | 'audience' | 'hubPublicUrl'>,
  ctx: SubscriberContext,
): IssuedSubscription {
  const list = allowedTopics(ctx);
  const token = mintToken(cfg, {
    role: 'subscribe',
    topics: list,
    key: cfg.subscriberKey,
    audience: subscriberAudience(cfg as RealtimeConfig),
    subject: ctx.userId,
    ttlSeconds: cfg.subscriberTtlSeconds,
  });
  return { token, topics: list, expiresAt: new Date(Date.now() + cfg.subscriberTtlSeconds * 1000) };
}
