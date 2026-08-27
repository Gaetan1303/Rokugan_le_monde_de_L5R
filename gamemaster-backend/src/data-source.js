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

const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'prod';

const isRenderInternal =
  databaseUrl.includes('.internal') ||
  databaseUrl.includes('dpg-');

const entities = isProd
  ? ['dist/models/**/*.js', 'dist/models/*.js']
  : [User, Scene, Scenario, Room, PlayerInRoom];

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,

  entities,

  synchronize: true,
  logging: false,

  ssl: isRenderInternal
    ? false
    : {
        rejectUnauthorized: false
      },

  connectTimeoutMS: 10000
});