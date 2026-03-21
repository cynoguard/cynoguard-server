import "dotenv/config";
import { defineConfig } from "prisma/config";

function ensureSslMode(connectionString: string): string {
  const parsed = new URL(connectionString);
  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }
  return parsed.toString();
}

const databaseUrl =
  process.env.DATABASE_PROD_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Always provide datasource URL so Prisma schema validation succeeds in CI.
  datasource: {
    url: ensureSslMode(databaseUrl),
  },
});