import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { authPreHandler } from "../../../lib/auth-hook.js";
import {
    handleListCandidates,
    handleAddCandidates,
} from "./candidates.handler.js";
import {
    listCandidatesSchema,
    addCandidatesSchema,
} from "./candidates.schema.js";

const candidateRoutes = async (
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) => {
    // GET /api/v1/watch-domains/:watchDomainId/candidates — List candidates
    fastify.get(
        "/api/v1/watch-domains/:watchDomainId/candidates",
        {
            schema: listCandidatesSchema,
            preHandler: authPreHandler,
        },
        handleListCandidates as any
    );

    // POST /api/v1/watch-domains/:watchDomainId/candidates — Add manual candidates
    fastify.post(
        "/api/v1/watch-domains/:watchDomainId/candidates",
        {
            schema: addCandidatesSchema,
            preHandler: authPreHandler,
        },
        handleAddCandidates as any
    );
};

export default candidateRoutes;
