import { syncOnboardingData } from "./onboarding.handler.js";
const onboardingRoutes = (fastify, options) => {
    // sync onboarding data
    fastify.put("/api/onboarding/sync", async (request, reply) => {
        return await syncOnboardingData(request, reply);
    });
};
export default onboardingRoutes;
