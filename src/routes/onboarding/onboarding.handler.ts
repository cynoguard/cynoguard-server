import type { FastifyReply, FastifyRequest } from "fastify";
import admin from 'firebase-admin';
import jwt from "jsonwebtoken";
import { auth } from "../../lib/firebase.js";
import { updateOnboardingData } from "../../services/onboarding.service.js";


export const syncOnboardingData = async(request:FastifyRequest,reply:FastifyReply)=>{
  const data = request.body;
  const token = request.headers.authorization?.split(" ")[1];
  try {
    if(!token){
       return reply.code(404).send({ status: "Not-Found" , message: "Token not found" });
    }
    const {uid,orgId,authId} = jwt.verify(token,process.env.JWT_SECRET!) as any; 

   
    if(!uid || !orgId || !authId){
       return reply.code(401).send({ status: "Unauthorized" , message: "Token not valid" });

    }

    const customToken = await auth.createCustomToken(authId);

    const {org,project} = await updateOnboardingData(data,uid,orgId);

   
   console.log("=== FIREBASE ADMIN DEBUG ===");
   console.log("Project ID:", admin.app().options.projectId);
   console.log("Service account:", (admin.app().options.credential as any)?.certificate?.clientEmail);
    return reply.code(200).send({ status: "success" , message: "Onboarding data synced successfully", data:{
      auth:{
        token:customToken
      },
      authId:{
        authId:authId
      },
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