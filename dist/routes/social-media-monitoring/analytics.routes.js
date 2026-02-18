import { getBrandAnalytics } from "../../services/analytics.service.js";
export default async function analyticsRoutes(fastify) {
    fastify.get("/brands/:id/analytics", {
        schema: {
            tags: ["Analytics"],
            description: "Get analytics for a brand",
        },
    }, async (request) => {
        const { id } = request.params;
        return getBrandAnalytics(id);
    });
}
