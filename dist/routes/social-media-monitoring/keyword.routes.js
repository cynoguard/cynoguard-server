import { getProjectKeywords, createKeyword, deleteKeyword, toggleKeyword } from "../../services/keyword.service.js";
export default async function keywordRoutes(app) {
    app.get("/projects/:projectId/keywords", async (req) => {
        const { projectId } = req.params;
        return getProjectKeywords(projectId);
    });
    app.post("/projects/:projectId/keywords", async (req) => {
        const { projectId } = req.params;
        const { value } = req.body;
        return createKeyword(projectId, value);
    });
    app.delete("/keywords/:id", async (req) => {
        const { id } = req.params;
        return deleteKeyword(id);
    });
    app.patch("/keywords/:id", async (req) => {
        const { id } = req.params;
        const { isActive } = req.body;
        return toggleKeyword(id, isActive);
    });
}
