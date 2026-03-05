import { authenticateUser, getAuthUser } from "./auth.handler.js";
import { authenticateSchema } from "./auth.schema.js";
const authRoutes = async (fastify, options) => {
    fastify.post("/api/auth/sync", { schema: authenticateSchema }, async (request, reply) => {
        return await authenticateUser(request, reply);
    });
    fastify.get("/api/auth/user", async (request, reply) => {
        return await getAuthUser(request, reply);
    });
};
export default authRoutes;
