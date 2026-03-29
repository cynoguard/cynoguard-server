import jwt from "jsonwebtoken";
import { auth } from "../../lib/firebase.js";
import { updateOnboardingData } from "../../services/onboarding.service.js";
export const syncOnboardingData = async (request, reply) => {
    const data = request.body;
    const token = request.headers.authorization?.split(" ")[1];
    try {
        if (!token) {
            return reply.code(404).send({ status: "Not-Found", message: "Token not found" });
        }
        const { uid, orgId, authId } = jwt.verify(token, "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09");
        if (!uid || !orgId || !authId) {
            return reply.code(401).send({ status: "Unauthorized", message: "Token not valid" });
        }
        const customToken = await auth.createCustomToken(authId);
        const { org, project } = await updateOnboardingData(data, uid, orgId);
        return reply.code(200).send({ status: "success", message: "Onboarding data synced successfully", data: {
                auth: {
                    token: customToken
                },
                authId: {
                    authId: authId
                },
                organization: {
                    id: org.id,
                    name: org.name,
                },
                project: {
                    id: project.id,
                    name: project.name,
                },
            } });
    }
    catch (error) {
        return reply.code(500).send({ status: "Internal Server", message: error.message });
    }
};
