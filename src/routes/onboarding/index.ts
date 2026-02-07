
import type { FastifyInstance } from 'fastify';


import { handlePostOnboarding, handleGetStatus } from './handler.js';
import { postOnboardingSchema, getStatusSchema } from './onboarding.schema.js';

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { schema: postOnboardingSchema }, handlePostOnboarding);
  fastify.get('/status/:userId', { schema: getStatusSchema }, handleGetStatus);
}