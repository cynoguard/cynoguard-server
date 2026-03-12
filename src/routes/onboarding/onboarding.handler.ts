import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { auth } from "../../lib/firebase.js";
import { updateOnboardingData } from "../../services/onboarding.service.js";


export const syncOnboardingData = async(request:FastifyRequest,reply:FastifyReply)=>{
  const data = request.body;
  const token = request.headers.authorization?.split(" ")[1];
  console.log("Token from URL:", token?.substring(0, 100));
console.log("Token parts:", token?.split(".").length);
  try {
    if(!token){
       return reply.code(404).send({ status: "Not-Found" , message: "Token not found" });
    }
    const {uid,orgId,authId} = jwt.verify(token,process.env.JWT_SECRET!) as any; 

   
    if(!uid || !orgId || !authId){
       return reply.code(401).send({ status: "Unauthorized" , message: "Token not valid" });

    }


    console.log("jwt payload uid:", uid);       // your internal DB uuid
    console.log("jwt payload authId:", authId);


    const customToken = await auth.createCustomToken(authId);


console.log("Token preview:", customToken.substring(0, 80));

    const {org,project} = await updateOnboardingData(data,uid,orgId);
    
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