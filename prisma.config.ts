import { config } from "dotenv";

// Manually load .env — Prisma skips this when prisma.config.ts is present
config(); 

import { defineConfig } from "prisma/config";

function ensureSslMode(connectionString: string): string {
  try {
    const parsed = new URL(connectionString);
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    return connectionString;
  }
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
  datasource: {
    url: ensureSslMode(databaseUrl),
  },
});