import { verifyFirebaseToken } from "../../services/firebase.service.js";
import { handleDbUser } from "../../services/user.service.js";
export const authenticateUser = async (request, reply) => {
    const token = request.headers.authorization?.replace("Bearer ", "");
    const body = request.body;
    try {
        // 1. Verify Token (Source of Truth for UID and Email)
        const decodedToken = await verifyFirebaseToken(token);
        if (!decodedToken) {
            return reply.code(401).send({ error: "Unauthorized", message: "Invalid Firebase token" });
        }
        const { uid, email } = decodedToken;
        const user = await handleDbUser(uid, email || "", body.firstName || "", body.lastName || "");
        return reply.code(200).send({
            status: "success",
            message: "Authentication successful",
            data: {
                uid: user.firebaseId,
                email: user.email,
                role: user.role,
                first_name: user.firstName || "",
                last_name: user.lastName || "",
                is_onboarded: user.isOnboarded,
            }
        });
    }
    catch (error) {
        console.error("Auth Error:", error);
        return reply.code(500).send({ error: "Internal Server Error", message: error.message });
    }
};
