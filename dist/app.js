import { Type } from "@sinclair/typebox";
// basic type for initial route path /
const healthResponseSchema = Type.Object({
    status: Type.String({ examples: ["Ok"] }),
});
const app = async (fastify, options) => {
    fastify.get("/", { schema: { tags: ["System"], description: "API health check", response: { 200: healthResponseSchema } } }, async (request, response) => {
        return { status: "Ok" };
    });
    // DB health check
    fastify.get('/api/health/db', async (request, reply) => {
        try {
            const result = await fastify.prisma.$queryRaw `SELECT NOW()`;
            return { status: 'ok', dbTime: result[0].now };
        }
        catch (err) {
            reply.status(500).send({ status: 'error', error: err });
        }
    });
};
export default app;
