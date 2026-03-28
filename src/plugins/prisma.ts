import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://postgres:cynoguard2026proddatabase1@cynoguard-prod-rds.cp0q4gcs4hbj.eu-north-1.rds.amazonaws.com:5432/cynoguard-prod-rds?sslmode=require",
  ssl: {
    rejectUnauthorized: false,
    ca: readFileSync("/home/ubuntu/rds-ca.pem").toString(),
  },
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });