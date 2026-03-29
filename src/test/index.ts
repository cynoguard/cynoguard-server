import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../plugins/prisma.js";
const test  = async(fastify:FastifyInstance,options:FastifyPluginOptions)=>{
  const loadChallengeValues = async (): Promise<string[]> => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const candidatePaths = [
      path.join(process.cwd(), "challenge.json"),
      path.join(process.cwd(), "src", "test", "challenge.json"),
      path.join(__dirname, "challenge.json"),
    ];

    let fileContent: string | null = null;
    for (const filePath of candidatePaths) {
      try {
        await access(filePath);
        fileContent = await readFile(filePath, "utf-8");
        break;
      } catch {
        // Try next path.
      }
    }

    if (!fileContent) {
      throw new Error("challenge.json file not found");
    }

    const parsed = JSON.parse(fileContent);
    if (!Array.isArray(parsed)) {
      throw new Error("challenge.json must be an array of strings");
    }

    const values = parsed
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return Array.from(new Set(values));
  };

// fastify.get("/test/db",async(request,reply)=>{
//     const org = await prisma.organization.create({
//     data: {
//       name: "CynoGuard Security",
//       industry: "Cybersecurity",
//       discoverSource: "Direct",
//     },
//   });

//   // 2. Create the Project
//   // We manually set the ID to match your controller's "test_project_cn_2026"
//   const project = await prisma.project.create({
//     data: {
//       name: "Main Production WebApp",
//       status: "active",
//       createdAt: new Date(),
//       organizationId: org.id, // Connects to the org we just made
//     },
//   });
// })
  fastify.post("/api/dev/challenge-bank/seed",async (request, reply) => {
    try {
      const values = await loadChallengeValues();

      const created = await prisma.challengeBank.createMany({
        data: values.map((value) => ({ value })),
        skipDuplicates: true,
      });

      return reply.code(200).send({
        status: "success",
        message: "ChallengeBank seeded",
        data: {
          sourceCount: values.length,
          insertedCount: created.count,
          skippedCount: values.length - created.count,
        },
      });
    } catch (error: any) {
      return reply.code(500).send({
        status: "error",
        message: error?.message || "Failed to seed ChallengeBank",
      });
    }
  });

  // Backward-compatible route retained for current workflows.
  fastify.post("/api/auth/load/prod",async (request, reply) => {
    try {
      const values = await loadChallengeValues();

      const created = await prisma.challengeBank.createMany({
        data: values.map((value) => ({ value })),
        skipDuplicates: true,
      });

      return reply.code(200).send({
        status: "success",
        message: "ChallengeBank seeded",
        data: {
          sourceCount: values.length,
          insertedCount: created.count,
          skippedCount: values.length - created.count,
        },
      });
    } catch (error: any) {
      return reply.code(500).send({
        status: "error",
        message: error?.message || "Failed to seed ChallengeBank",
      });
    }
  });
   fastify.get("/api/auth/load/prod",async (request, reply) => {
    const data = await prisma.challengeBank.findMany(
   );

   return reply.code(200).send({data:data});
  });
};

export default test;