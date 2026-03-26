import { config } from "dotenv";

// Manually load .env — Prisma skips this when prisma.config.ts is present
config({ override: true }); 

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

function getEnv(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const databaseProdUrl = getEnv("DATABASE_PROD_URL");
const databaseUrl = databaseProdUrl ?? getEnv("DATABASE_URL");

if (!databaseUrl) {
  throw new Error(
    "Missing database URL. Set DATABASE_PROD_URL (recommended for AWS RDS) or DATABASE_URL."
  );
}

if (!databaseProdUrl) {
  // Guardrail: avoid silently using localhost when production URL is not configured.
  const parsed = new URL(databaseUrl);
  if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
    throw new Error(
      "DATABASE_PROD_URL is not set and DATABASE_URL points to localhost. Set DATABASE_PROD_URL to your AWS RDS connection string."
    );
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: ensureSslMode(databaseUrl),
  },
});