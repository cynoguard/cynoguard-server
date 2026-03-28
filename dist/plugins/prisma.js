import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
const pool = new Pool({
    connectionString: process.env.DATABASE_PROD_URL,
    ssl: {
        rejectUnauthorized: true,
        ca: readFileSync("/home/ubuntu/rds-ca.pem").toString(),
    },
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
