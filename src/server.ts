
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import 'dotenv/config';
import Fastify, { type FastifyInstance } from "fastify";
import app from './app.js';
import { prisma } from "./plugins/prisma.js";
import { swaggerOption, swaggerUiOptions } from './plugins/swagger.js';
import authRoutes from './routes/auth/index.js';
import botDetectionRoutes from './routes/v1/bot-detection/index.js';
import "./lib/worker.js";
import "./lib/scheduler.js";
import "./lib/processing.worker.js"
import "./lib/processing.scheduler.js"
import brandRoutes from "./routes/social-media-monitoring/brand.routes.js";
import mentionRoutes from "./routes/social-media-monitoring/mention.routes.js";
import analyticsRoutes from "./routes/social-media-monitoring/analytics.routes.js";
import keywordRoutes from "./routes/social-media-monitoring/keyword.routes.js";
import dashboardRoutes from "./routes/social-media-monitoring/dashboard.routes.js";
import alertRoutes from "./routes/social-media-monitoring/alert.routes.js"


declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const fastify:FastifyInstance = Fastify({
 logger:true
});

const allowedOrigins = ['http://localhost:3000','http://localhost:3001','http://localhost:3002','http://localhost:3003'];

await fastify.register(cors, {
  origin: allowedOrigins, // Restricts access to specified origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  credentials: true, // If you need to handle cookies or authorization headers
});

fastify.decorate("prisma", prisma);

fastify.register(fastifySwagger,swaggerOption);
fastify.register(fastifySwaggerUi,swaggerUiOptions);
fastify.register(app);
fastify.register(authRoutes);
fastify.register(botDetectionRoutes);

const start = async()=>{
    try {
        const port = 4000;
        await fastify.listen({port:port,host:'0.0.0.0'});
    } catch (error) {
        fastify.log.error(error)
        process.exit(1)
    }
}

await fastify.register(brandRoutes);
await fastify.register(mentionRoutes);
await fastify.register(analyticsRoutes);
await fastify.register(keywordRoutes);
await fastify.register(dashboardRoutes);

await fastify.register(alertRoutes);

start();