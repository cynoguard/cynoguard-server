import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "../plugins/prisma.js";

const test = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  
  // Helper to clean strings
  const normalizeValues = (raw: any[]): string[] => {
    return Array.from(new Set(
      raw
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    ));
  };

  /**
   * SEED FROM JSON FILE
   * Reads from: ./challenge.json (root of your project or folder level)
   */
 fastify.post("/api/dev/challenge-bank/seed-file", async (request, reply) => {
  try {
    const filePath = path.resolve(process.cwd(), "challenge.json");
    const fileContent = await readFile(filePath, "utf-8");
    
    // Direct parse
    const values: string[] = JSON.parse(fileContent);

    // Direct insert
    const created = await prisma.challengeBank.createMany({
      data: values.map((val) => ({ value: val })),
      skipDuplicates: true, 
    });

    return reply.send({ status: "success", inserted: created.count });
  } catch (error: any) {
    return reply.code(500).send({ error: error.message });
  }
});

  // Your existing GET route
  fastify.get("/api/auth/load/prod", async (request, reply) => {
    const data = await prisma.challengeBank.findMany();
    return reply.code(200).send({ data });
  });
};

export default test;