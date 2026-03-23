import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../plugins/prisma.js";
const test  = async(fastify:FastifyInstance,options:FastifyPluginOptions)=>{
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
  fastify.post("/api/auth/load/prod",async (request, reply) => {
    
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   const filePath = path.join(__dirname,"challenge.json");

   const file = await readFile(filePath,"utf-8");
    await prisma.challengeBank.createMany({
      data:{
        value:file,
      },
      skipDuplicates:true
    });

    return reply.code(200).send({status:"success",da:file});
  });
   fastify.get("/api/auth/load/prod",async (request, reply) => {
    const data = await prisma.challengeBank.findMany(
   );

   return reply.code(200).send({data:data});
  });
};

export default test;