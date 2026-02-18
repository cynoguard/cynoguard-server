import { getAllBrands, getBrandById } from "../../services/brand.service.js";
export default async function brandRoutes(fastify) {
    fastify.get("/brands", {
        schema: {
            tags: ["Brand"],
            description: "Get all brands",
        },
    }, async () => {
        return getAllBrands();
    });
    fastify.get("/brands/:id", {
        schema: {
            tags: ["Brand"],
            description: "Get brand by ID",
        },
    }, async (request) => {
        const { id } = request.params;
        return getBrandById(id);
    });
}
