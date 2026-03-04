import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { updateOnboardingData } from "../../services/onboarding.service.js";


export const syncOnboardingData = async(request:FastifyRequest,reply:FastifyReply)=>{
  const data = request.body;
  const token = request.headers.authorization?.replace("Bearer ", " ").split(" ")[1];
  try {
    if(!token){
       return reply.code(404).send({ status: "Not-Found" , message: "Token not found" });
    }
    const {uid,orgId} = jwt.verify(token,process.env.JWT_SECRET!) as any; 
   
    if(!uid || !orgId){
       return reply.code(401).send({ status: "Unauthorized" , message: "Token not valid" });

    }
    const {org,project} = await updateOnboardingData(data,uid,orgId);

    return reply.code(200).send({ status: "success" , message: "Onboarding data synced successfully", data:{
      organization:{
        id:org.id,
        name:org.name,
      },
      project:{
        id:project.id,
        name:project.name,
      },
    } });
    
  } catch (error:any) {
        return reply.code(500).send({ status: "Internal Server" , message: error.message });
  }
}