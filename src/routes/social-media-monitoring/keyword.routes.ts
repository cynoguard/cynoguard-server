import type{ FastifyInstance } from "fastify";
import{
  getProjectKeywords,
  createKeyword,
  deleteKeyword,
  toggleKeyword
} from "../../services/keyword.service.js";

export default async function keywordRoutes(app: FastifyInstance) {

  app.get("/projects/:projectId/keywords", async (req) => {
    const { projectId } = req.params as { projectId: string };
    return getProjectKeywords(projectId);
  });

  app.post("/projects/:projectId/keywords", async (req) => {
    const { projectId } = req.params as { projectId: string };
    const { value } = req.body as { value: string };

    return createKeyword(projectId, value);
  });

  app.delete("/keywords/:id", async (req) => {
    const { id } = req.params as { id: string };
    return deleteKeyword(id);
  });

  app.patch("/keywords/:id", async (req) => {
    const { id } = req.params as { id: string };
    const { isActive } = req.body as { isActive: boolean };

    return toggleKeyword(id, isActive);
  });
}