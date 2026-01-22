import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

// basic type for initial route path /
const HealthResponseSchema  = Type.Object({
    status:Type.String({examples:["Ok"]}),
});



const app = async (fastify:FastifyInstance,options:FastifyPluginOptions) => {

fastify.get("/",{schema:{tags:["System"],description:"API health check",response:{200:HealthResponseSchema }}},async (request,response) => {
    return {status:"Ok"}
});

// DB health check
fastify.get('/api/health/db', async (request, reply) => {
  try {
    const result:any = await fastify.prisma.$queryRaw`SELECT NOW()`
    return { status: 'ok', dbTime: result[0].now }
  } catch (err) {
    reply.status(500).send({ status: 'error', error: err })
  }
})

}

export default app;