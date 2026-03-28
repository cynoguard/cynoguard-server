import { config } from "dotenv";
config({ override: true });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
},
  datasource: {
    url: "postgresql://postgres:cynoguard2026proddatabase1@cynoguard-prod-rds.cp0q4gcs4hbj.eu-north-1.rds.amazonaws.com:5432/cynoguard-prod-rds?sslmode=require",
  },
});