import { Pool } from "pg";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  adapter: async () => {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const connectionString = process.env.DATABASE_PROD_URL!;
    const pool = new Pool({ 
      connectionString,
      ssl: {
        rejectUnauthorized: true,
        ca: require("fs").readFileSync("/home/ubuntu/rds-ca.pem").toString(),
      }
    });
    return new PrismaPg(pool);
  },
});