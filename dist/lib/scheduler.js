import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { ingestionQueue } from "./queue.js";
const prisma = new PrismaClient();
cron.schedule("*/10 * * * *", async () => {
    const projects = await prisma.project.findMany({
        include: {
            keywords: {
                where: { isActive: true },
            },
        },
    });
    for (const project of projects) {
        for (const keyword of project.keywords) {
            await ingestionQueue.add("fetch", {
                projectId: project.id,
                keyword: keyword.value,
            });
        }
    }
});
