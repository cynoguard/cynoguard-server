/**
 * Cron plugin — schedules the domain monitoring cycle every 6 hours.
 */

import cron from "node-cron";
import { runMonitoringCycle } from "../services/monitoring.service.js";

/**
 * Initialize the cron scheduler.
 * Runs every 6 hours at minute 0.
 */
export function setupCron(): void {
    const cronExpression = "0 */6 * * *";

    cron.schedule(cronExpression, async () => {
        console.log(
            `[Cron] Triggering monitoring cycle at ${new Date().toISOString()}`
        );
        try {
            await runMonitoringCycle();
        } catch (error) {
            console.error("[Cron] Monitoring cycle failed:", error);
        }
    });

    console.log(`[Cron] Monitoring cron scheduled: every 6 hours (${cronExpression})`);
}
