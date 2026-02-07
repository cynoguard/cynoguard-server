import { type FastifyInstance, type FastifyPluginOptions, type FastifyReply, type FastifyRequest } from 'fastify';
import { verifyHuman } from './bot-detection.handler.js';
import { verifyHumanSchema } from './bot-detection.schema.js';
const botDetectionRoutes = async (fastify:FastifyInstance,options:FastifyPluginOptions) => {
    
  
    // Bot detection v1 api route
    fastify.post("/api/v1/bot-detection/verify",{schema:verifyHumanSchema},async (request:FastifyRequest,reply:FastifyReply) => {
        return await verifyHuman(request,reply);
    });



}

export default botDetectionRoutes;