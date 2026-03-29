import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import "dotenv/config";
import Fastify, { type FastifyInstance } from "fastify";
import app from "./app.js";
import { prisma } from "./plugins/prisma.js";
import { swaggerOption, swaggerUiOptions } from "./plugins/swagger.js";
import authRoutes from "./routes/auth/index.js";
import botAnalyticsRoute from "./routes/bot-analytics/index.js";
import dashboardRoutes from "./routes/dashboard/index.js";
import onboardingRoutes from "./routes/onboarding/index.js";
import settingsRoutes from "./routes/settings/index.js";
import botDetectionRoutes from "./routes/v1/bot-detection/index.js";
import domainMonitoringRoutes from "./routes/v1/domain-monitoring/index.js";
import socialMonitoringRoutes from "./routes/v1/social-monitoring/index.js";
import test from "./test/index.js";

// Domain Monitoring imports
import { setupCron } from './plugins/cron.js';
import { setupWebSocket } from './plugins/websocket.js';
import alertRoutes from './routes/v1/alerts/index.js';
import candidateRoutes from './routes/v1/candidates/index.js';
import watchDomainRoutes from './routes/v1/watch-domains/index.js';

// ✅ FIX: Import the social monitoring scheduler (was never imported/called before)
import { startMonitoringScheduler } from './scheduler/monitoring.scheduler.js';

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const fastify: FastifyInstance = Fastify({
  logger: true
});

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003',"https://console.cynoguard.com","https://cynoguard.com","https://cdn.cynoguard.com","http://127.0.0.1:5500"];

await fastify.register(cors, {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
});

fastify.decorate("prisma", prisma);

fastify.register(fastifySwagger, swaggerOption);
fastify.register(fastifySwaggerUi, swaggerUiOptions);
fastify.register(app);
fastify.register(authRoutes);
fastify.register(botDetectionRoutes);
fastify.register(onboardingRoutes);
fastify.register(dashboardRoutes);
fastify.register(botAnalyticsRoute);
fastify.register(socialMonitoringRoutes);
fastify.register(settingsRoutes);
fastify.register(test);
fastify.register(domainMonitoringRoutes);

// Domain Monitoring routes
fastify.register(watchDomainRoutes);
fastify.register(candidateRoutes);
fastify.register(alertRoutes);

const start = async () => {
  try {
    const port = 4000;
    await fastify.listen({ port: port, host: '0.0.0.0' });

    // Initialize WebSocket (after Fastify is listening)
    setupWebSocket(fastify);

    // Initialize domain monitoring cron scheduler
    setupCron();

    // ✅ FIX: Start social monitoring scheduler (was missing — never called before)
    startMonitoringScheduler(prisma, fastify.log);

    console.log(`Server running on http://localhost:${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();