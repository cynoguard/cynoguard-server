// src/plugins/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { readFileSync } from 'node:fs';
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_PROD_URL,
    ssl: {
        rejectUnauthorized: true,
        ca: readFileSync('/home/ubuntu/rds-ca.pem').toString(),
    }
});
export const prisma = new PrismaClient({ adapter });
