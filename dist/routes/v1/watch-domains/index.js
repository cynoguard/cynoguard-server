import { authPreHandler } from "../../../lib/auth-hook.js";
import { handleCreateWatchDomain, handleListWatchDomains, } from "./watch-domains.handler.js";
import { createWatchDomainSchema, listWatchDomainsSchema, } from "./watch-domains.schema.js";
const watchDomainRoutes = async (fastify, options) => {
    // POST /api/v1/watch-domains — Create a new watch domain
    fastify.post("/api/v1/watch-domains", {
        schema: createWatchDomainSchema,
        preHandler: authPreHandler,
    }, handleCreateWatchDomain);
    // GET /api/v1/watch-domains — List watch domains
    fastify.get("/api/v1/watch-domains", {
        schema: listWatchDomainsSchema,
        preHandler: authPreHandler,
    }, handleListWatchDomains);
};
export default watchDomainRoutes;
