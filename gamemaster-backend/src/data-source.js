import { DataSource } from "typeorm";
import { User } from "./models/User.js";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL n\'est pas défini dans les variables d\'environnement.');
}
export const AppDataSource = new DataSource({
    type: "postgres",
    url: databaseUrl,
    synchronize: true,
    logging: false,
    entities: [User],
    ssl: { rejectUnauthorized: false }
});
//# sourceMappingURL=data-source.js.map