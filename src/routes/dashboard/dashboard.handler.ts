import type { FastifyReply, FastifyRequest } from "fastify";
import { generateSecureApiKey } from "../../lib/crypto.js";
import { createNewApiKey, deleteApiKey, syncApiKeyConnectionStatus, syncApiKeyData, syncApiKeysList, syncOrganizationData, syncProjectsData, updateApiKeyInfo } from "../../services/dashboard.service.js";

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



export const getOrganizations = async (request: FastifyRequest, reply: FastifyReply,)=>{
  const { authId } = request.params as { authId: string };
  try {
    if(!authId){
    return reply.code(404).send({ error: "Not-Found", message: "Auth id not found" });
    }

    const organizations = await syncOrganizationData(authId);
    
    return reply.code(200).send({ status:"success", message:"organizations fetched successfully", data:{
      organizations:organizations,
    }});
    
  } catch (error: any) {
    return reply.code(500).send({ error: "Internal Server Error", message: error.message });
  }
}



export const createApiKey = async (request: FastifyRequest, reply: FastifyReply,)=>{
  const {name,projectId} = request.body as any;
  try {
    if(!name || !projectId){
    return reply.code(404).send({ error: "Not-Found", message: "Required body data not found" });
    }

    const { apiKey, hashedKey } = generateSecureApiKey();

    const data = await createNewApiKey(name,hashedKey,projectId);

    return reply.code(200).send({ status:"success", message:"API key created successfully", data:{
      api_key:apiKey,
      name:data.name,
      id:data.id,
    }});
    
  } catch (error: any) {
    return reply.code(500).send({ error: "Internal Server Error", message: error.message });
  }
}


export const getApiKeyData = async (request: FastifyRequest, reply: FastifyReply,)=>{
  const {id} = request.params as {id:string}
  try {

    if(!id){
    return reply.code(404).send({ error: "Not-Found", message: "API key id not found" });
    }

    const data = await syncApiKeyData(id);

    return reply.code(200).send({ status:"success", message:"API key created successfully", data:data});
    
  } catch (error: any) {
    return reply.code(500).send({ error: "Internal Server Error", message: error.message });
  }
}

export const getApiKeyStatus = async (request: FastifyRequest, reply: FastifyReply,)=>{
  const {id} = request.params as {id:string}
  try {

    if(!id){
    return reply.code(404).send({ error: "Not-Found", message: "API key id not found" });
    }

    const data = await syncApiKeyConnectionStatus(id);

    console.log(data);

    return reply.code(200).send({ status:"success", message:"API key status fetched successfully", data:{
      connected: data != undefined ? true:false
    }});
    
  } catch (error: any) {
    return reply.code(500).send({ error: "Internal Server Error", message: error.message });
  }
}



export const getApiKeysList = async (request: FastifyRequest, reply: FastifyReply,)=>{
  const {projectId} = request.params as {projectId:string}
  try {

    if(!projectId){
    return reply.code(404).send({ error: "Not-Found", message: "Project id not found" });
    }

    const data = await syncApiKeysList(projectId)

    return reply.code(200).send({ status:"success", message:"API key list fetched successfully", data:data});
    
  } catch (error: any) {
    return reply.code(500).send({ error: "Internal Server Error", message: error.message });
  }
}


export const updateApiKeyData = async (request: FastifyRequest, reply: FastifyReply,)=>{
  const {id} = request.params as {id:string}
  const {status} = request.body as {status:string}
  try {

    if(!id){
    return reply.code(404).send({ error: "Not-Found", message: "API key id not found" });
    }

    const data = await updateApiKeyInfo(id,status)

    return reply.code(200).send({ status:"success", message:"API key updated successfully", data:data});
    
  } catch (error: any) {
    return reply.code(500).send({ error: "Internal Server Error", message: error.message });
  }
}


export const revokeApiKey = async (request: FastifyRequest, reply: FastifyReply,)=>{
  const {id} = request.params as {id:string}
  try {

    if(!id){
    return reply.code(404).send({ error: "Not-Found", message: "API key id not found" });
    }

    const data = await deleteApiKey(id)

    return reply.code(200).send({ status:"success", message:"API key revoked successfully"});
    
  } catch (error: any) {
    return reply.code(500).send({ error: "Internal Server Error", message: error.message });
  }
}

