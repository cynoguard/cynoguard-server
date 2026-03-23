import type { FastifyReply, FastifyRequest } from "fastify";
import {
    listCandidates,
    addManualCandidates,
} from "../../../services/candidate.service.js";

interface CandidateParams {
    watchDomainId: string;
}

interface AddCandidatesBody {
    domains: string[];
}

export const handleListCandidates = async (
    request: FastifyRequest<{ Params: CandidateParams }>,
    reply: FastifyReply
) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: "Unauthorized", message: "Not authenticated" });
        }

        const result = await listCandidates(
            request.params.watchDomainId,
            user.tenantId
        );

        return reply.code(200).send(result);
    } catch (error: any) {
        if (error?.message?.includes("not found")) {
            return reply
                .code(404)
                .send({ error: "Not Found", message: error.message });
        }
        console.error("[Candidates] Error listing candidates:", error);
        return reply
            .code(500)
            .send({ error: "Internal Server Error", message: error?.message || "Unknown error" });
    }
};

export const handleAddCandidates = async (
    request: FastifyRequest<{ Params: CandidateParams; Body: AddCandidatesBody }>,
    reply: FastifyReply
) => {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: "Unauthorized", message: "Not authenticated" });
        }

        const addedCount = await addManualCandidates(
            request.params.watchDomainId,
            user.tenantId,
            request.body.domains
        );

        return reply.code(200).send({ added: addedCount });
    } catch (error: any) {
        if (error?.message?.includes("not found")) {
            return reply
                .code(404)
                .send({ error: "Not Found", message: error.message });
        }
        console.error("[Candidates] Error adding candidates:", error);
        return reply
            .code(500)
            .send({ error: "Internal Server Error", message: error?.message || "Unknown error" });
    }
};
