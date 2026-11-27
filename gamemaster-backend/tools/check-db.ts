/**
 * Teste la connexion à PostgreSQL EXACTEMENT comme le serveur le fait (même décision TLS, mêmes diagnostics).
 *
 *   npx tsx tools/check-db.ts "postgresql://utilisateur:motdepasse@hote:5432/base"
 *   (ou définis DATABASE_URL, puis : npx tsx tools/check-db.ts)
 *
 * À lancer depuis TON poste : si ça marche ici mais pas sur l'hébergeur, le problème est l'accès réseau
 * (liste d'accès IP, URL interne/externe) ; si ça échoue aussi ici, la base ou l'URL sont en cause.
 * Le mot de passe n'est jamais affiché.
 */
import pg from 'pg';
import { decideDbSsl, withoutSslParams } from '../src/dbSsl.js';
import { describeDbTarget, formatDbError } from '../src/dbDiagnostics.js';

const url = process.argv[2] ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Usage : npx tsx tools/check-db.ts "<DATABASE_URL>"   (ou définis la variable DATABASE_URL)');
  process.exit(2);
}

const ssl = decideDbSsl(url, process.env);
const tls = ssl.enabled ? `activé (${ssl.reason})` : 'désactivé';
console.log(`Base visée : ${describeDbTarget(url)}`);
console.log(`TLS : ${tls}`);

const client = new pg.Client({
  connectionString: withoutSslParams(url),
  ssl: ssl.enabled ? { rejectUnauthorized: ssl.rejectUnauthorized } : false,
  connectionTimeoutMillis: 15000,
});

const started = Date.now();
try {
  await client.connect();
  const { rows } = await client.query<{ v: string; db: string }>('select version() as v, current_database() as db');
  console.log(`\n✔ Connexion réussie en ${Date.now() - started} ms`);
  console.log(`  Base : ${rows[0].db}`);
  console.log(`  Serveur : ${rows[0].v.split(',')[0]}`);
} catch (error) {
  console.error(`\n✘ Échec après ${Date.now() - started} ms\n`);
  console.error(formatDbError(error, url, tls).join('\n'));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
