import {} from 'fastify';
import { updateDetectionData, updateSessionData } from '../../../services/bot-detection.service.js';
import { reTakeBotChallenge, verifyBotChallenge, verifyBotSessionToken, verifyHuman } from './bot-detection.handler.js';
import { verifyChallengeSchema, verifyHumanSchema } from './bot-detection.schema.js';
const botDetectionRoutes = async (fastify, options) => {
    // Bot detection v1 api route
    fastify.post("/api/v1/bot-detection/verify", { schema: verifyHumanSchema, onResponse: async (request, reply) => {
            await updateSessionData(request.auditData);
        } }, async (request, reply) => {
        return await verifyHuman(request, reply);
    });
    // verify bot detection challenge
    fastify.post("/api/v1/verify-challenge", { schema: verifyChallengeSchema }, async (request, reply) => {
        return await verifyBotChallenge(request, reply);
    });
    //retake challenge
    fastify.get("/api/v1/retake-challenge", { onResponse: async (request, reply) => { await updateDetectionData(request.auditData); } }, async (request, reply) => {
        return await reTakeBotChallenge(request, reply);
    });
    // verify client-side cookie session token
    fastify.get("/api/v1/verify-session", async (request, reply) => {
        return await verifyBotSessionToken(request, reply);
    });
};
export default botDetectionRoutes;
