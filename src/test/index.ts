import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { existsSync } from "fs"; // Add this import
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "../plugins/prisma.js";

const test = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  
  fastify.post("/api/dev/challenge-bank/seed-file", async (request, reply) => {
    try {
      // 1. Try Root (process.cwd is usually the project root where you run 'npm start')
      let filePath = path.resolve(process.cwd(), "challenge.json");

      // 2. Fallback: Check if file exists, if not, try one level up from the current directory
      if (!existsSync(filePath)) {
        const altPath = path.resolve(process.cwd(), "..", "challenge.json");
        if (existsSync(altPath)) {
          filePath = altPath;
        } else {
          throw new Error(`challenge.json not found at ${filePath} or ${altPath}`);
        }
      }

      // 3. Read and Parse
      const fileContent = await readFile(filePath, "utf-8");
      const values: string[] = JSON.parse(fileContent);

      // 4. (Optional) Wipe old data first so the DB matches the JSON exactly
      // await prisma.challengeBank.deleteMany({}); 

      // 5. Batch insert
      const created = await prisma.challengeBank.createMany({
        data: values.map((value) => ({ value })),
        skipDuplicates: true,
      });

      return reply.code(200).send({
        status: "success",
        message: "ChallengeBank seeded from file",
        data: {
          pathUsed: filePath,
          insertedCount: created.count,
        },
      });
    } catch (error: any) {
      return reply.code(500).send({
        status: "error",
        message: error?.message || "Failed to seed ChallengeBank",
      });
    }
  });

  // Existing GET route
  fastify.get("/api/auth/load/prod", async (request, reply) => {
    const data = await prisma.challengeBank.findMany();
    return reply.code(200).send({ data });
  });
};

export default test;