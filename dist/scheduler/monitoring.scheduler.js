import cron from "node-cron";
import { scanAllProjects } from "../services/monitoring.service.js";
let scheduledTask = null;
export function startMonitoringScheduler(prisma, logger) {
    if (scheduledTask) {
        logger.warn("[SocialMonitoring] Scheduler already running");
        return;
    }
    logger.info("[SocialMonitoring] Scheduler started — fires every 6 hours");
    scheduledTask = cron.schedule("0 */6 * * *", async () => {
        logger.info("[SocialMonitoring] Cron fired");
        try {
            await scanAllProjects(prisma, logger);
        }
        catch (err) {
            logger.error({ err }, "[SocialMonitoring] Cron error");
        }
    });
}
export function stopMonitoringScheduler() {
    scheduledTask?.stop();
    scheduledTask = null;
}
