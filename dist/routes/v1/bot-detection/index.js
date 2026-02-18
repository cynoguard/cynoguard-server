import {} from 'fastify';
import { verifyHuman } from './bot-detection.handler.js';
import { verifyHumanSchema } from './bot-detection.schema.js';
const botDetectionRoutes = async (fastify, options) => {
    // Bot detection v1 api route
    fastify.post("/api/v1/bot-detection/verify", { schema: verifyHumanSchema }, async (request, reply) => {
        return await verifyHuman(request, reply);
    });
};
export default botDetectionRoutes;
