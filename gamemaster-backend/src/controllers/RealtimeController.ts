import type { Request, Response } from 'express';
import { roomService } from '../services/roomService.js';
import { getRealtimeConfig, issueSubscriberToken, subscribeParam } from '../realtime/index.js';
import type { SubscriberContext } from '../realtime/index.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/realtime/session?roomId=<uuid>
 *
 * Délivre à l'utilisateur authentifié un jeton d'abonnement Mercure limité aux topics qu'il a le
 * droit de lire (monde, ses messages, et la table demandée s'il en est membre ; /gm s'il en est MJ).
 * Le client renouvelle avant `expiresAt` (appel de la même route, puis réouverture du flux).
 *
 * Deux modes (MERCURE_AUTH_MODE) :
 *  - cookie : le jeton est posé en cookie HttpOnly limité au chemin du hub ; le front ouvre une
 *             EventSource avec `withCredentials: true`.
 *  - bearer : le jeton est renvoyé dans le corps ; le front lit le flux avec fetch() et l'en-tête
 *             `Authorization: Bearer`. Obligatoire quand le hub est sur un autre domaine.
 */
export async function getRealtimeSession(req: Request, res: Response): Promise<void> {
  const cfg = getRealtimeConfig();
  if (!cfg) {
    res.status(503).json({ error: 'Temps réel indisponible' });
    return;
  }
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentification requise' });
    return;
  }

  const ctx: SubscriberContext = { realmId: cfg.defaultRealmId, userId: user.id };

  const roomId = typeof req.query.roomId === 'string' ? req.query.roomId : undefined;
  if (roomId) {
    if (!UUID_RE.test(roomId)) {
      res.status(400).json({ error: 'roomId invalide' });
      return;
    }
    // Le créateur d'une table en est le MJ même sans ligne PlayerInRoom.
    const [gmId, membership] = await Promise.all([
      roomService.getGmId(roomId),
      roomService.getPlayerInRoom(roomId, user.id),
    ]);
    if (gmId === user.id || membership?.role === 'gm') ctx.gmTableIds = [roomId];
    else if (membership) ctx.playerTableIds = [roomId];
    else {
      res.status(403).json({ error: 'Vous ne faites pas partie de cette table' });
      return;
    }
  }

  const issued = issueSubscriberToken(cfg, ctx);

  const payload: Record<string, unknown> = {
    hubUrl: cfg.hubPublicUrl,
    /** Paramètre d'URL à utiliser pour chaque topic : `match` (Mercure 1.x) ou `topic` (legacy). */
    subscribeParam: subscribeParam(cfg.protocol),
    topics: issued.topics,
    expiresAt: issued.expiresAt.toISOString(),
    authMode: cfg.authMode,
  };

  if (cfg.authMode === 'cookie') {
    res.cookie(cfg.cookieName, issued.token, {
      httpOnly: true,
      secure: cfg.cookieSecure,
      sameSite: cfg.cookieSameSite,
      domain: cfg.cookieDomain,
      // Le cookie n'est envoyé qu'au hub (chemin exigé par la doc Mercure).
      path: new URL(cfg.hubPublicUrl).pathname,
      maxAge: cfg.subscriberTtlSeconds * 1000,
    });
  } else {
    payload.token = issued.token;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json(payload);
}
