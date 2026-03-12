import { type FastifyInstance, type FastifyPluginOptions, type FastifyReply, type FastifyRequest } from 'fastify';
import { apiKeyValidation } from '../../../hooks/auth.js';
import { updateDetectionData, updateSessionData } from '../../../services/bot-detection.service.js';
import type { verifyHumanBodyType } from '../../../types/bot-detection.js';
import { reTakeBotChallenge, verifyBotChallenge, verifyBotSessionToken, verifyHuman } from './bot-detection.handler.js';
import { verifyChallengeSchema, verifyHumanSchema } from './bot-detection.schema.js';

const botDetectionRoutes = async (fastify:FastifyInstance,options:FastifyPluginOptions) => {
    // auth middleware
  fastify.addHook("onRequest",apiKeyValidation);
  
    // Bot detection v1 api route
    fastify.post<{Body:verifyHumanBodyType}>("/api/v1/bot-detection/verify",{schema:verifyHumanSchema,onResponse:async(request,reply)=>{await updateSessionData(request.auditData);
}},async (request:FastifyRequest<{Body:verifyHumanBodyType}>,reply:FastifyReply) => {
        return await verifyHuman(request,reply);
    });


    // verify bot detection challenge
    fastify.post("/api/v1/verify-challenge",{schema:verifyChallengeSchema},async (request:FastifyRequest,reply:FastifyReply) => {
        return await verifyBotChallenge(request,reply);
    });

    //retake challenge
    fastify.get("/api/v1/retake-challenge",{onResponse:async(request,reply)=>{await updateDetectionData(request.auditData)}},async (request:FastifyRequest,reply:FastifyReply) => {  
      return await reTakeBotChallenge(request,reply);
    });

    // verify client-side cookie session token
    fastify.get("/api/v1/verify-session",async (request:FastifyRequest,reply:FastifyReply) => {
      return await verifyBotSessionToken(request,reply);
    });




}

export default botDetectionRoutes;