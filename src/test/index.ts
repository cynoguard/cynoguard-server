import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { readFile } from "node:fs/promises";
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
    
    const file = await readFile("./challenge.json","utf-8");
    const d = JSON.parse(file);
    await prisma.challengeBank.createMany({
      data:{
        value:d,
      },
      skipDuplicates:true
    });

    return reply.code(200).send({status:"success"});
  });
   fastify.get("/api/auth/load/prod",async (request, reply) => {
    const data = await prisma.challengeBank.findMany(
   );

   return reply.code(200).send({data:data});
  });
};

export default test;