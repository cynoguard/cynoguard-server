
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import 'dotenv/config';
import Fastify, { type FastifyInstance } from "fastify";
import app from './app.js';
import { prisma } from "./plugins/prisma.js";
import { swaggerOption, swaggerUiOptions } from './plugins/swagger.js';
declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const fastify:FastifyInstance = Fastify({
 logger:true
});

fastify.decorate("prisma", prisma);

fastify.register(fastifySwagger,swaggerOption);
fastify.register(fastifySwaggerUi,swaggerUiOptions);
fastify.register(app);

const start = async()=>{
    try {
        const port = 4000;
        await fastify.listen({port:port,host:'0.0.0.0'});
    } catch (error) {
        fastify.log.error(error)
        process.exit(1)
    }
}

start();