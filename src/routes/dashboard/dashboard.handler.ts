import type { FastifyReply, FastifyRequest } from "fastify";
import { syncProjectsData } from "../../services/dashboard.service.js";

export const getOrganizationProjects = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { orgId } = request.params as { orgId: string };
  try {
    if(!orgId){
    return reply.code(404).send({ error: "Not-Found", message: "Organization name not found" });
    }

    const projects = await syncProjectsData(orgId);
    
    return reply.code(200).send({ status:"success", message:"projects fetched successfully", data:{
        projects:projects
    } });
    
  } catch (error: any) {
    return reply.code(500).send({ error: "Internal Server Error", message: error.message });
  }
};
