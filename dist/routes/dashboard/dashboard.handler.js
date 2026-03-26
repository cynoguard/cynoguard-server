import { generateSecureApiKey } from "../../lib/crypto.js";
import { createNewApiKey, deleteApiKey, syncApiKeyConnectionStatus, syncApiKeyData, syncApiKeysList, syncOrganizationData, syncProjectsData, updateApiKeyInfo } from "../../services/dashboard.service.js";
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
export const getOrganizations = async (request, reply) => {
    const { authId } = request.params;
    try {
        if (!authId) {
            return reply.code(404).send({ error: "Not-Found", message: "Auth id not found" });
        }
        const organizations = await syncOrganizationData(authId);
        return reply.code(200).send({ status: "success", message: "organizations fetched successfully", data: {
                organizations: organizations,
            } });
    }
    catch (error) {
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
export const createApiKey = async (request, reply) => {
    const { name, projectId } = request.body;
    try {
        if (!name || !projectId) {
            return reply.code(404).send({ error: "Not-Found", message: "Required body data not found" });
        }
        const { apiKey, hashedKey } = generateSecureApiKey();
        const data = await createNewApiKey(name, hashedKey, projectId);
        return reply.code(200).send({ status: "success", message: "API key created successfully", data: {
                api_key: apiKey,
                name: data.name,
                id: data.id,
            } });
    }
    catch (error) {
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
export const getApiKeyData = async (request, reply) => {
    const { id } = request.params;
    try {
        if (!id) {
            return reply.code(404).send({ error: "Not-Found", message: "API key id not found" });
        }
        const data = await syncApiKeyData(id);
        return reply.code(200).send({ status: "success", message: "API key created successfully", data: data });
    }
    catch (error) {
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
export const getApiKeyStatus = async (request, reply) => {
    const { id } = request.params;
    try {
        if (!id) {
            return reply.code(404).send({ error: "Not-Found", message: "API key id not found" });
        }
        const data = await syncApiKeyConnectionStatus(id);
        console.log(data);
        return reply.code(200).send({ status: "success", message: "API key status fetched successfully", data: {
                connected: data != undefined ? true : false
            } });
    }
    catch (error) {
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
export const getApiKeysList = async (request, reply) => {
    const { projectId } = request.params;
    try {
        if (!projectId) {
            return reply.code(404).send({ error: "Not-Found", message: "Project id not found" });
        }
        const data = await syncApiKeysList(projectId);
        return reply.code(200).send({ status: "success", message: "API key list fetched successfully", data: data });
    }
    catch (error) {
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
export const updateApiKeyData = async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;
    try {
        if (!id) {
            return reply.code(404).send({ error: "Not-Found", message: "API key id not found" });
        }
        const data = await updateApiKeyInfo(id, status);
        return reply.code(200).send({ status: "success", message: "API key updated successfully", data: data });
    }
    catch (error) {
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
export const revokeApiKey = async (request, reply) => {
    const { id } = request.params;
    try {
        if (!id) {
            return reply.code(404).send({ error: "Not-Found", message: "API key id not found" });
        }
        const data = await deleteApiKey(id);
        return reply.code(200).send({ status: "success", message: "API key revoked successfully" });
    }
    catch (error) {
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
