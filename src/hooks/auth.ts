import type { FastifyReply, FastifyRequest } from "fastify";
import { getHash } from "../lib/crypto.js";
import { getApiKeyWithHashKey } from "../services/bot-detection.service.js";

export const apiKeyValidation = async (request:FastifyRequest,reply:FastifyReply)=>{
    const apiKey = request.headers["x-api-key"]; 
    try {

        if(!apiKey){
          return reply.code(404).send({error:"Not-Found",message:"Api key is not found"});
        }

        const hashKey = getHash(apiKey.toString());

        const apiKeyRecord = await getApiKeyWithHashKey(hashKey);

        if(!apiKeyRecord?.id){
           return reply.code(401).send({error:"Unauthorized",message:"Api key is not authorized"});
        }
        
        request.projectId = apiKeyRecord.projectId;

    } catch (error:any) {
       return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }

}