export const postOnboardingSchema = {
    description: 'Submit company details to complete onboarding',
    tags: ['Onboarding'],
    body: {
        type: 'object',
        required: ['userId', 'name'],
        properties: {
            userId: { type: 'string' },
            name: { type: 'string' },
            industry: { type: 'string' }
        }
    },
    response: {
        201: {
            type: 'object',
            properties: {
                status: { type: 'boolean' },
                message: { type: 'string' },
                data: {
                    type: 'object',
                    properties: {
                        organizationId: { type: 'string' },
                        isOnboarded: { type: 'boolean' }
                    }
                }
            }
        }
    }
};
export const getStatusSchema = {
    description: 'Check if a user has completed onboarding',
    tags: ['Onboarding'],
    params: {
        type: 'object',
        properties: { userId: { type: 'string' } }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                status: { type: 'boolean' },
                message: { type: 'string' },
                data: {
                    type: 'object',
                    properties: {
                        isOnboarded: { type: 'boolean' },
                        email: { type: 'string' }
                    }
                }
            }
        }
    }
};
