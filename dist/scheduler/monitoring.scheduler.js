import cron from "node-cron";
import { scanAllProjects } from "../services/social-monitoring.service.js";
/**
 * Starts the social monitoring cron job.
 * Fires every 6 hours: 00:00, 06:00, 12:00, 18:00 UTC.
 *
 * Uses CynoGuard's shared X_BEARER_TOKEN from env.
 * Scans every project that has active keywords — no per-project credentials needed.
 */
export function startMonitoringScheduler(prisma, logger) {
    // Validate that the X token is configured before starting
    // X_BEARER_TOKEN hardcoded
    cron.schedule("0 */6 * * *", async () => {
        logger.info("[SocialMonitoring] Cron fired — scanning all projects");
        await scanAllProjects(prisma, logger);
    });
    logger.info("[SocialMonitoring] Scheduler started — fires every 6 hours");
}
