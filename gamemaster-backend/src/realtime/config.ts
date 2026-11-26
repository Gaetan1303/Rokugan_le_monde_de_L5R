export interface RealtimeConfig {
  /** URL du hub pour PUBLIER (côté serveur), ex. http://localhost:3901/.well-known/mercure */
  hubUrl: string;
  /** URL du hub pour S'ABONNER (côté navigateur). Par défaut identique à hubUrl. */
  hubPublicUrl: string;
  publisherKey: string;
  subscriberKey: string;
  /** Durée de vie du jeton d'abonné, en secondes. */
  subscriberTtlSeconds: number;

  /**
   * Protocole Mercure du hub :
   *  - `1`      : Mercure 1.x (OAuth 2.0, jetons RFC 9068 `at+jwt`). Défaut.
   *  - `legacy` : Mercure 0.x (claim `mercure`). Pour un hub managé qui n'a pas migré.
   */
  protocol: '1' | 'legacy';
  /** Émetteur de confiance du hub (claim `iss`). Doit correspondre à MERCURE_TRUSTED_ISSUERS du hub. */
  issuer: string;
  /** Audience forcée (claim `aud`). Sinon : l'URL du hub contactée (hubUrl / hubPublicUrl). */
  audience?: string;

  /**
   * Comment le navigateur présente son jeton :
   *  - `cookie`  : cookie HttpOnly (EventSource). Le hub et l'API doivent partager un domaine.
   *  - `bearer`  : le front lit le flux avec fetch() + en-tête Authorization. Seul choix possible
   *                si le hub est sur un AUTRE domaine (ex. front GitHub Pages, hub ailleurs).
   * Mercure 1.x n'accepte plus de jeton dans l'URL.
   */
  authMode: 'cookie' | 'bearer';
  cookieName: string;
  cookieDomain?: string;
  cookieSameSite: 'strict' | 'lax';
  cookieSecure: boolean;

  /** Royaume utilisé tant que les instances multiples (S8-4) n'existent pas. */
  defaultRealmId: string;
}

export const LEGACY_COOKIE_NAME = 'mercureAuthorization';
export const V1_COOKIE_NAME = '__Secure-mercure_access_token';
/** Nom sans préfixe `__Secure-` pour le développement en HTTP (à déclarer avec `cookie_name` côté hub). */
export const DEV_COOKIE_NAME = 'mercure_access_token';

/** Paramètre d'URL de sélection des topics à l'abonnement, selon le protocole. */
export const subscribeParam = (protocol: RealtimeConfig['protocol']) => (protocol === 'legacy' ? 'topic' : 'match');

export const publisherAudience = (c: RealtimeConfig) => c.audience ?? c.hubUrl;
export const subscriberAudience = (c: RealtimeConfig) => c.audience ?? c.hubPublicUrl;

/**
 * Lit la configuration. Renvoie `null` si MERCURE_URL est absent : le temps réel Mercure est
 * alors désactivé (le reste du serveur continue de fonctionner).
 */
export function loadRealtimeConfig(env: NodeJS.ProcessEnv = process.env): RealtimeConfig | null {
  const hubUrl = env.MERCURE_URL?.trim();
  if (!hubUrl) return null;

  const publisherKey = env.MERCURE_PUBLISHER_JWT_KEY ?? '';
  const subscriberKey = env.MERCURE_SUBSCRIBER_JWT_KEY ?? '';
  const isProduction = env.NODE_ENV === 'production';

  if (!publisherKey || !subscriberKey) {
    throw new Error('MERCURE_PUBLISHER_JWT_KEY et MERCURE_SUBSCRIBER_JWT_KEY sont requis quand MERCURE_URL est défini.');
  }
  if (isProduction && (publisherKey.length < 32 || subscriberKey.length < 32)) {
    throw new Error('Les clés JWT Mercure doivent faire au moins 32 caractères en production.');
  }
  if (publisherKey === subscriberKey) {
    throw new Error('Utilise deux clés différentes pour l’éditeur et l’abonné.');
  }

  const protocol = env.MERCURE_PROTOCOL === 'legacy' ? 'legacy' : '1';
  const issuerEnv = env.MERCURE_ISSUER?.trim();
  if (protocol === '1' && isProduction && !issuerEnv) {
    throw new Error('MERCURE_ISSUER est requis en production (doit correspondre à MERCURE_TRUSTED_ISSUERS du hub).');
  }

  const authMode = env.MERCURE_AUTH_MODE === 'bearer' ? 'bearer' : 'cookie';
  const cookieSecure = env.MERCURE_COOKIE_SECURE ? env.MERCURE_COOKIE_SECURE === 'true' : isProduction;
  const defaultCookieName =
    protocol === 'legacy' ? LEGACY_COOKIE_NAME : cookieSecure ? V1_COOKIE_NAME : DEV_COOKIE_NAME;

  return {
    hubUrl,
    hubPublicUrl: env.MERCURE_PUBLIC_URL?.trim() || hubUrl,
    publisherKey,
    subscriberKey,
    subscriberTtlSeconds: Number(env.MERCURE_SUBSCRIBER_TTL_SECONDS) || 900,
    protocol,
    issuer: issuerEnv || 'https://localhost',
    audience: env.MERCURE_AUDIENCE?.trim() || undefined,
    authMode,
    cookieName: env.MERCURE_COOKIE_NAME?.trim() || defaultCookieName,
    cookieDomain: env.MERCURE_COOKIE_DOMAIN?.trim() || undefined,
    cookieSameSite: env.MERCURE_COOKIE_SAMESITE === 'lax' ? 'lax' : 'strict',
    cookieSecure,
    defaultRealmId: env.DEFAULT_REALM_ID?.trim() || 'default',
  };
}
