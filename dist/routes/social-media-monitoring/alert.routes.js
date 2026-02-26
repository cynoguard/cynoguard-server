import { prisma } from "../../plugins/prisma.js";
export default async function alertRoutes(fastify) {
    // Get alerts for project
    fastify.get("/:projectId", async (request, reply) => {
        const { projectId } = request.params;
        const alerts = await prisma.alert.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        });
        return alerts;
    });
    // Mark alert as read
    fastify.patch("/:alertId/read", async (request, reply) => {
        const { alertId } = request.params;
        await prisma.alert.update({
            where: { id: alertId },
            data: { isRead: true },
        });
        return { success: true };
    });
}
