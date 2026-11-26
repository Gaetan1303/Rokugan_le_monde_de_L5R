import 'dotenv/config';
import { DataSource } from 'typeorm';
import { decideDbSsl, withoutSslParams } from './dbSsl.js';

import { User } from './models/User.js';
import { Scene } from './models/Scene.js';
import { Scenario } from './models/Scenario.js';
import { Room } from './models/Room.js';
import { PlayerInRoom } from './models/PlayerInRoom.js';
import { EventLog } from './models/EventLog.js';
import { EventSequence } from './models/EventSequence.js';
import { Outbox } from './models/Outbox.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL n'est pas défini dans les variables d'environnement."
  );
}

const isProduction = process.env.NODE_ENV === 'production';

const dbSsl = decideDbSsl(databaseUrl, process.env);

console.log(
  `PostgreSQL: ${isProduction ? 'production' : 'development'} / TLS ${dbSsl.enabled ? `activé (${dbSsl.reason})` : 'désactivé'}`
);

export const AppDataSource = new DataSource({
  type: 'postgres',

  // Les paramètres TLS de l'URL sont retirés : seule la décision de decideDbSsl s'applique (voir dbSsl.ts).
  url: withoutSslParams(databaseUrl),

  entities: isProduction
    ? ['dist/models/**/*.js']
    : [
        User,
        Scene,
        Scenario,
        Room,
        PlayerInRoom,
        EventLog,
        EventSequence,
        Outbox,
      ],

  synchronize: true,

  logging: false,

  connectTimeoutMS: 15000,

  ssl: dbSsl.enabled ? { rejectUnauthorized: dbSsl.rejectUnauthorized } : false,
});