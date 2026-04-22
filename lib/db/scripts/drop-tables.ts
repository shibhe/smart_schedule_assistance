import pg from "pg";
const { Client } = pg;
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  console.log("Dropping all tables...");
  await client.query(`
    DROP TABLE IF EXISTS "suggestions" CASCADE;
    DROP TABLE IF EXISTS "push_subscriptions" CASCADE;
    DROP TABLE IF EXISTS "chat_messages" CASCADE;
    DROP TABLE IF EXISTS "events" CASCADE;
    DROP TABLE IF EXISTS "users" CASCADE;
    DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;
  `);
  console.log("Tables dropped successfully");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
