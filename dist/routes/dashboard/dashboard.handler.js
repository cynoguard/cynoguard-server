import { syncProjectsData } from "../../services/dashboard.service.js";
export const getOrganizationProjects = async (request, reply) => {
    const { orgId } = request.params;
    try {
        if (!orgId) {
            return reply.code(404).send({ error: "Not-Found", message: "Organization name not found" });
        }
        const projects = await syncProjectsData(orgId);
        return reply.code(200).send({ status: "success", message: "projects fetched successfully", data: {
                projects: projects
            } });
    }
    catch (error) {
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
