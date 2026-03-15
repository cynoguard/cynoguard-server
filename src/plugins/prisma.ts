// src/lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_PROD_URL!,
});

export const prisma = new PrismaClient({adapter});
