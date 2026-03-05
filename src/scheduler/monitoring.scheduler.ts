import cron from "node-cron";
import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import { scanAllProjects } from "../services/monitoring.service.js";

let scheduledTask: cron.ScheduledTask | null = null;


export function startMonitoringScheduler(
  prisma: PrismaClient,
  logger: FastifyBaseLogger
): void {
  if (scheduledTask) {
    logger.warn("[SocialMonitoring] Scheduler already running");
    return;
  }

  logger.info("[SocialMonitoring] Scheduler started — fires every 6 hours");

  scheduledTask = cron.schedule(
    "0 */6 * * *",
    async () => {
      logger.info("[SocialMonitoring] Cron fired");
      try {
        await scanAllProjects(prisma, logger);
      } catch (err) {
        logger.error({ err }, "[SocialMonitoring] Cron error");
      }
    }
  );
}

export function stopMonitoringScheduler(): void {
  scheduledTask?.stop();
  scheduledTask = null;
}