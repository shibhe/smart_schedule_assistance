const postgres = require("postgres");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

async function main() {
  console.log("Dropping all tables...");
  try {
    await client.unsafe(`
      DROP TABLE IF EXISTS "suggestions" CASCADE;
      DROP TABLE IF EXISTS "push_subscriptions" CASCADE;
      DROP TABLE IF EXISTS "chat_messages" CASCADE;
      DROP TABLE IF EXISTS "events" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;
    `);
    console.log("Tables dropped successfully");
  } catch (err) {
    console.error("Error dropping tables:", err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
