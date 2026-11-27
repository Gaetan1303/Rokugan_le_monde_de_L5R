/**
 * Diagnostic des erreurs de connexion PostgreSQL. Fonctions pures (testables) : le serveur les affiche.
 * Rien ici n'écrit ni ne renvoie jamais l'identifiant ou le mot de passe de la base.
 */

/** « hôte:port/base » de l'URL, sans identifiants. */
export function describeDbTarget(databaseUrl: string | undefined): string {
  if (!databaseUrl) return '(DATABASE_URL non défini)';
  const m = databaseUrl.match(/^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]*@)?(\[[^\]]+\]|[^:/?#]+)(?::(\d+))?(?:\/([^?#]*))?/i);
  if (!m) return '(URL illisible)';
  return `${m[1]}${m[2] ? `:${m[2]}` : ''}${m[3] ? `/${m[3]}` : ''}`;
}

const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|0\.0\.0\.0)$/i;

export function dbHost(databaseUrl: string | undefined): string | undefined {
  return databaseUrl ? describeDbTarget(databaseUrl).split(/[:/]/)[0] : undefined;
}

interface ErrLike { message?: string; code?: string; cause?: unknown }
const asErr = (e: unknown): ErrLike =>
  e === undefined || e === null ? {} : typeof e === 'object' ? (e as ErrLike) : { message: String(e) };

/** Pistes concrètes selon l'erreur. Une erreur inconnue renvoie une liste vide. */
export function dbErrorHints(err: unknown, databaseUrl?: string): string[] {
  const e = asErr(err);
  const cause = asErr(e.cause);
  const text = `${e.message ?? ''} ${cause.message ?? ''}`.toLowerCase();
  const code = (e.code ?? cause.code ?? '').toString();
  const hints: string[] = [];

  const host = dbHost(databaseUrl);
  if (host && LOCAL_HOST.test(host) && process.env.NODE_ENV === 'production') {
    hints.push("L'hôte de DATABASE_URL est « " + host + " » : depuis un hébergeur, c'est le conteneur du serveur lui-même, pas ta machine ni ton Docker.");
  }

  if (text.includes('connection terminated unexpectedly')) {
    hints.push(
      "La base a coupé la connexion dès son ouverture. Causes fréquentes : base en pause, en cours de réveil ou expirée (selon le plan) ; " +
        "liste d'accès IP qui n'autorise pas ce serveur ; pooler ou proxy qui ferme la connexion ; hôte interne et externe confondus " +
        '(sur un même hébergeur, utilise l\'URL interne de la base).',
    );
  }
  if (code === 'ECONNREFUSED') hints.push("Rien n'écoute sur cet hôte et ce port : base arrêtée, mauvais port, ou hôte inaccessible depuis ce serveur.");
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') hints.push("Le nom d'hôte est introuvable (faute de frappe, ou nom interne utilisé hors du réseau de l'hébergeur).");
  if (code === 'ETIMEDOUT' || text.includes('timeout expired') || text.includes('connection timeout')) {
    hints.push("Délai dépassé : pare-feu ou liste d'accès IP, mauvais hôte, ou base en veille qui se réveille.");
  }
  if (code === '28P01' || text.includes('password authentication failed')) hints.push("Identifiant ou mot de passe refusé : recopie l'URL depuis le tableau de bord de la base (attention aux caractères spéciaux du mot de passe, à encoder).");
  if (code === '3D000' || /database ".*" does not exist/.test(text)) hints.push("La base nommée dans l'URL n'existe pas.");
  if (text.includes('self-signed certificate') || text.includes('unable to verify') || text.includes('certificate has expired') || text.includes('hostname/ip does not match')) {
    hints.push('Certificat TLS refusé : laisse DATABASE_SSL_REJECT_UNAUTHORIZED à false (valeur par défaut), sauf si ta base présente un certificat public valide.');
  }
  if (text.includes('ssl/tls required') || text.includes('no encryption') || text.includes('sslmode')) {
    hints.push('La base exige TLS : définis DATABASE_SSL=true (ou NODE_ENV=production).');
  }
  if (text.includes('does not support ssl')) hints.push('La base ne gère pas TLS : définis DATABASE_SSL=false.');
  return hints;
}

/** Lignes de rapport prêtes à afficher. */
export function formatDbError(err: unknown, databaseUrl: string | undefined, tls: string): string[] {
  const e = asErr(err);
  const cause = asErr(e.cause);
  const lines = [
    `Erreur : ${e.message ?? String(err)}`,
    ...(e.code || cause.code ? [`Code : ${e.code ?? cause.code}`] : []),
    ...(cause.message && cause.message !== e.message ? [`Cause : ${cause.message}`] : []),
    `Base visée : ${describeDbTarget(databaseUrl)}`,
    `TLS : ${tls}`,
  ];
  const hints = dbErrorHints(err, databaseUrl);
  if (hints.length) lines.push('Pistes :', ...hints.map((h) => `  - ${h}`));
  return lines;
}

export interface Initializable { initialize(): Promise<unknown>; }
export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
  /** Plafond du délai entre deux tentatives. */
  maxDelayMs?: number;
  onRetry?: (error: unknown, attempt: number, attempts: number, waitMs: number) => void;
  sleep?: (ms: number) => Promise<void>;
}

/** Tente `initialize()` plusieurs fois (délai croissant). Utile quand la base se réveille ou démarre en parallèle. */
export async function initializeWithRetry(ds: Initializable, opts: RetryOptions = {}): Promise<void> {
  const attempts = Math.max(1, opts.attempts ?? 5);
  const base = opts.delayMs ?? 3000;
  const max = opts.maxDelayMs ?? 15000;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let attempt = 1; ; attempt++) {
    try {
      await ds.initialize();
      return;
    } catch (error) {
      if (attempt >= attempts) throw error;
      const wait = Math.min(base * attempt, max);
      opts.onRetry?.(error, attempt, attempts, wait);
      await sleep(wait);
    }
  }
}
