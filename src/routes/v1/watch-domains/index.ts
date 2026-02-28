import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { authPreHandler } from "../../../lib/auth-hook.js";
import {
    handleCreateWatchDomain,
    handleListWatchDomains,
} from "./watch-domains.handler.js";
import {
    createWatchDomainSchema,
    listWatchDomainsSchema,
} from "./watch-domains.schema.js";

const watchDomainRoutes = async (
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) => {
    // POST /api/v1/watch-domains — Create a new watch domain
    fastify.post(
        "/api/v1/watch-domains",
        {
            schema: createWatchDomainSchema,
            preHandler: authPreHandler,
        },
        handleCreateWatchDomain as any
    );

    // GET /api/v1/watch-domains — List watch domains
    fastify.get(
        "/api/v1/watch-domains",
        {
            schema: listWatchDomainsSchema,
            preHandler: authPreHandler,
        },
        handleListWatchDomains as any
    );
};

export default watchDomainRoutes;
