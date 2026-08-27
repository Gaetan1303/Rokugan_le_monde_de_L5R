import 'dotenv/config';
import { DataSource } from 'typeorm';

import { User } from './models/User.js';
import { Scene } from './models/Scene.js';
import { Scenario } from './models/Scenario.js';
import { Room } from './models/Room.js';
import { PlayerInRoom } from './models/PlayerInRoom.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL n'est pas défini dans les variables d'environnement."
  );
}

const isProduction = process.env.NODE_ENV === 'production';

const useSSL =
  process.env.DB_SSL === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',

  url: databaseUrl,

  entities: isProduction
    ? ['dist/models/**/*.js']
    : [
        User,
        Scene,
        Scenario,
        Room,
        PlayerInRoom,
      ],

  synchronize: true,

  logging: false,

  connectTimeoutMS: 15000,

  ssl: useSSL
    ? {
        rejectUnauthorized: false,
      }
    : false,
});