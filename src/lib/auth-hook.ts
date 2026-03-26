/**
 * Reusable Fastify preHandler hook for Firebase authentication.
 * Verifies Bearer token, resolves user + org membership,
 * and attaches { userId, tenantId, email } to request.user.
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../plugins/prisma.js";
import { verifyFirebaseToken } from "../services/firebase.service.js";

export const authPreHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply
            .code(401)
            .send({ error: "Unauthorized", message: "Missing or invalid Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
        return reply
            .code(401)
            .send({ error: "Unauthorized", message: "Invalid Firebase token" });
    }

    // Look up user by Firebase UID
    const user = await prisma.user.findUnique({
        where: { firebaseId: decoded.uid },
    });

    if (!user) {
        return reply
            .code(401)
            .send({ error: "Unauthorized", message: "User not found" });
    }

    // Look up organization membership to get tenantId
    const membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
    });

    if (!membership) {
        return reply
            .code(403)
            .send({ error: "Forbidden", message: "User has no organization membership" });
    }

    // Attach auth claims to request
    request.user = {
        userId: user.id,
        tenantId: membership.organizationId,
        email: user.email,
    };
};
