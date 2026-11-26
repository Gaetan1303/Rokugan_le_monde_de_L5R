/**
 * Décide si la connexion PostgreSQL doit utiliser TLS.
 *
 * Avant : le TLS n'était activé QUE si NODE_ENV=production. Sur un hébergeur où NODE_ENV n'est pas
 * défini (Render, service créé à la main), la base managée refusait la connexion ("SSL/TLS required").
 *
 * Maintenant, par ordre de priorité :
 *   1. DATABASE_SSL=true|false : décision explicite ;
 *   2. `sslmode` dans DATABASE_URL : `disable` désactive ; `require|verify-ca|verify-full` (ou `ssl=true`) active ;
 *   3. NODE_ENV=production ;
 *   4. sinon : désactivé (PostgreSQL local ou Docker).
 */
export interface DbSslDecision {
  enabled: boolean;
  /** Vérifie le certificat du serveur. Faux par défaut (comportement historique) ; DATABASE_SSL_REJECT_UNAUTHORIZED=true pour l'exiger. */
  rejectUnauthorized: boolean;
  reason: string;
}

const TRUE_VALUES = new Set(['true', '1', 'yes', 'on', 'require']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off', 'disable']);

export function decideDbSsl(databaseUrl: string, env: NodeJS.ProcessEnv): DbSslDecision {
  const rejectUnauthorized = env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true';
  const flag = (env.DATABASE_SSL ?? '').trim().toLowerCase();

  if (TRUE_VALUES.has(flag)) return { enabled: true, rejectUnauthorized, reason: 'DATABASE_SSL' };
  if (FALSE_VALUES.has(flag)) return { enabled: false, rejectUnauthorized, reason: 'DATABASE_SSL=false' };

  if (/[?&]sslmode=disable(&|$)/i.test(databaseUrl)) {
    return { enabled: false, rejectUnauthorized, reason: 'DATABASE_URL (sslmode=disable)' };
  }
  if (/[?&]sslmode=(require|verify-ca|verify-full)(&|$)/i.test(databaseUrl) || /[?&]ssl=true(&|$)/i.test(databaseUrl)) {
    return { enabled: true, rejectUnauthorized, reason: 'DATABASE_URL (sslmode)' };
  }
  if (env.NODE_ENV === 'production') return { enabled: true, rejectUnauthorized, reason: 'NODE_ENV=production' };
  return { enabled: false, rejectUnauthorized, reason: 'local' };
}

const SSL_URL_PARAMS = new Set(['sslmode', 'ssl', 'sslcert', 'sslkey', 'sslrootcert', 'sslcrl', 'uselibpqcompat']);

/**
 * Retire de l'URL les paramètres TLS. Indispensable : le pilote `pg` lit `sslmode` dans l'URL et ÉCRASE
 * l'option `ssl` fournie à TypeORM (par exemple, `sslmode=require` y impose la vérification du certificat,
 * ce qui échoue avec un certificat auto-signé). Seule la décision de `decideDbSsl` doit s'appliquer.
 */
export function withoutSslParams(databaseUrl: string): string {
  const q = databaseUrl.indexOf('?');
  if (q === -1) return databaseUrl;
  const kept = databaseUrl
    .slice(q + 1)
    .split('&')
    .filter((pair) => pair && !SSL_URL_PARAMS.has(decodeURIComponent(pair.split('=')[0]).toLowerCase()));
  return kept.length ? `${databaseUrl.slice(0, q)}?${kept.join('&')}` : databaseUrl.slice(0, q);
}
