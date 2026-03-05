import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import "dotenv/config";
import Fastify, {} from "fastify";
import app from "./app.js";
import { prisma } from "./plugins/prisma.js";
import { swaggerOption, swaggerUiOptions } from "./plugins/swagger.js";
import authRoutes from "./routes/auth/index.js";
import dashboardRoutes from "./routes/dashboard/index.js";
import onboardingRoutes from "./routes/onboarding/index.js";
import botDetectionRoutes from "./routes/v1/bot-detection/index.js";
import test from "./test/index.js";
import socialMonitoringRoutes from "./routes/v1/social-monitoring/index.js";
import { startMonitoringScheduler } from "./scheduler/monitoring.scheduler.js";
const fastify = Fastify({
    logger: true,
});
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
];
await fastify.register(cors, {
    origin: allowedOrigins, // Restricts access to specified origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    credentials: true, // If you need to handle cookies or authorization headers
});
fastify.decorate("prisma", prisma);
fastify.register(fastifySwagger, swaggerOption);
fastify.register(fastifySwaggerUi, swaggerUiOptions);
fastify.register(app);
fastify.register(authRoutes);
fastify.register(botDetectionRoutes);
fastify.register(onboardingRoutes);
fastify.register(dashboardRoutes);
fastify.register(socialMonitoringRoutes);
//test file
fastify.register(test);
const start = async () => {
    try {
        const port = 4000;
        await fastify.listen({ port: port, host: "0.0.0.0" });
        startMonitoringScheduler(fastify.prisma, fastify.log);
    }
    catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
};
start();
