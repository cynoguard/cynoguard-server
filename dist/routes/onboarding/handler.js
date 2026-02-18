import { onboardingService } from '../../services/onboarding.service.js';
export const handlePostOnboarding = async (req, reply) => {
    try {
        const { userId, name, industry } = req.body;
        const data = await onboardingService.saveCompanyDetails(userId, name, industry);
        return reply.status(201).send({
            status: true,
            message: "Company profile created successfully",
            data
        });
    }
    catch (error) {
        return reply.status(500).send({
            status: false,
            message: error.message || "Internal Server Error",
            data: null
        });
    }
};
export const handleGetStatus = async (req, reply) => {
    try {
        const { userId } = req.params;
        const data = await onboardingService.getOnboardingStatus(userId);
        return reply.status(200).send({
            status: true,
            message: "Status retrieved",
            data
        });
    }
    catch (error) {
        return reply.status(500).send({
            status: false,
            message: error.message,
            data: null
        });
    }
};
