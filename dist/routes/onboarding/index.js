import { handlePostOnboarding, handleGetStatus } from './handler.js';
import { postOnboardingSchema, getStatusSchema } from './onboarding.schema.js';
export default async function (fastify) {
    fastify.post('/', { schema: postOnboardingSchema }, handlePostOnboarding);
    fastify.get('/status/:userId', { schema: getStatusSchema }, handleGetStatus);
}
