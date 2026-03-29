import {} from 'fastify';
import { apiKeyValidation } from '../../../middleware/auth.middleware.js';
import { ruleMiddleware } from '../../../middleware/rule.middleware.js';
import { updateDetectionData, updateSessionData } from '../../../services/bot-detection.service.js';
import { OrgParams, ProjectParams } from '../../dashboard/dashboard.schema.js';
import { getOrgDashboard, getProjectDashboard, reTakeBotChallenge, verifyBotChallenge, verifyBotSessionToken, verifyHuman } from './bot-detection.handler.js';
import { verifyChallengeSchema, verifyHumanSchema } from './bot-detection.schema.js';
const botDetectionRoutes = async (fastify, options) => {
    // auth middleware
    fastify.addHook("onRequest", apiKeyValidation);
    // Bot detection v1 api route
    fastify.post("/api/v1/bot-detection/verify", { schema: verifyHumanSchema, onResponse: async (request, reply) => {
            try {
                if (request.auditData) {
                    await updateSessionData(request.auditData);
                }
            }
            catch (error) {
                request.log.error(error, "bot-detection: failed to persist detection audit data");
            }
        }, preHandler: ruleMiddleware }, async (request, reply) => {
        return await verifyHuman(request, reply);
    });
    // verify bot detection challenge
    fastify.post("/api/v1/verify-challenge", { schema: verifyChallengeSchema }, async (request, reply) => {
        return await verifyBotChallenge(request, reply);
    });
    //retake challenge
    fastify.get("/api/v1/retake-challenge", { onResponse: async (request, reply) => {
            try {
                if (request.auditData) {
                    await updateDetectionData(request.auditData);
                }
            }
            catch (error) {
                request.log.error(error, "bot-detection: failed to persist retake audit data");
            }
        } }, async (request, reply) => {
        return await reTakeBotChallenge(request, reply);
    });
    // verify client-side cookie session token
    fastify.get("/api/v1/verify-session", async (request, reply) => {
        return await verifyBotSessionToken(request, reply);
    });
    fastify.get("/api/v1/orgs/:orgId/dashboard", { schema: { tags: ["Dashboard"], params: OrgParams } }, (req, rep) => getOrgDashboard(fastify, req, rep));
    fastify.get("/api/v1/projects/:projectId/dashboard", { schema: { tags: ["Dashboard"], params: ProjectParams } }, (req, rep) => getProjectDashboard(fastify, req, rep));
};
export default botDetectionRoutes;
