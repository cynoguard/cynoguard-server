import type { FastifyInstance } from "fastify";
import  { getDashboardData } from "../../services/dashboard.service.js";

export default async function dashboardRoutes(app: FastifyInstance) {

  app.get("/projects/:projectId/dashboard", async (req) => {
    const { projectId } = req.params as { projectId: string };
    return getDashboardData(projectId);
  });

}