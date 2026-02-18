import { getMentionsByBrand } from "../../services/mention.service.js";
export default async function mentionRoutes(fastify) {
    fastify.get("/brands/:id/mentions", {
        schema: {
            tags: ["Mentions"],
            description: "Get mentions for a brand",
        },
    }, async (request) => {
        const { id } = request.params;
        const { sentiment } = request.query;
        return getMentionsByBrand(id, sentiment);
    });
}
