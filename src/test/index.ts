import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { prisma } from "../plugins/prisma.js";

const test  = async(fastify:FastifyInstance,options:FastifyPluginOptions)=>{
fastify.get("/test/db",async(request,reply)=>{
    const org = await prisma.organization.create({
    data: {
      name: "CynoGuard Security",
      industry: "Cybersecurity",
      discoverSource: "Direct",
    },
  });

  // 2. Create the Project
  // We manually set the ID to match your controller's "test_project_cn_2026"
  const project = await prisma.project.create({
    data: {
      name: "Main Production WebApp",
      status: "active",
      createdAt: new Date(),
      organizationId: org.id, // Connects to the org we just made
    },
  });
})

};

export default test;