import "dotenv/config";
import { defineConfig } from "prisma/config";

function ensureSslMode(connectionString: string): string {
  const parsed = new URL(connectionString);
  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }
  return parsed.toString();
}

const databaseUrl = process.env.DATABASE_PROD_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Only set datasource if URL is available (not needed for `prisma generate`)
  ...(databaseUrl ? {
    datasource: {
      url: ensureSslMode(databaseUrl),
    },
  } : {}),
});