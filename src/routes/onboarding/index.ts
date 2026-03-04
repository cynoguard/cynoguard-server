import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { syncOnboardingData } from "./onboarding.handler.js";

const onboardingRoutes = (fastify:FastifyInstance,options:FastifyPluginOptions)=>{


  // sync onboarding data
  fastify.put("/api/onboarding/sync",async(request:FastifyRequest,reply:FastifyReply)=>{
    return await syncOnboardingData(request,reply);
  });
  
}

export default onboardingRoutes;