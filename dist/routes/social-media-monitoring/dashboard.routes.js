import { getDashboardData } from "../../services/dashboard.service.js";
export default async function dashboardRoutes(app) {
    app.get("/projects/:projectId/dashboard", async (req) => {
        const { projectId } = req.params;
        return getDashboardData(projectId);
    });
}
