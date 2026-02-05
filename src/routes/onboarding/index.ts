import type { FastifyInstance } from "fastify";
import { onboardingPostSchema, type OnboardingBodyType } from "./onboading.schema.js";
import { createOrganization, getOnboardingStatus } from "../../services/onboarding.service.js";

export default async function (fastify: FastifyInstance) {
  
  // Build POST /onboarding
  fastify.post<{ Body: OnboardingBodyType }>(
    "/", 
    { schema: onboardingPostSchema }, 
    async (request, reply) => {
      // request.user.id comes from your Firebase Auth middleware
      const userId = (request.user as any).id; 
      const { name, industry } = request.body;

      const org = await createOrganization(userId, name, industry);

      return reply.code(201).send({
        status: true,
        message: "Organization created successfully",
        data: { organizationId: org.id }
      });
    }
  );

  // Build GET /onboarding/status
  fastify.get("/status", async (request, reply) => {
    const userId = (request.user as any).id;
    const isCompleted = await getOnboardingStatus(userId);

    return reply.send({
      status: true,
      message: "Onboarding status retrieved",
      data: { isCompleted }
    });
  });
}