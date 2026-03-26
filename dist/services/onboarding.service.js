import { prisma } from "../plugins/prisma.js";
export const updateOnboardingData = async (data, uid, orgId) => {
    return await prisma.$transaction(async (tx) => {
        const org = await tx.organization.upsert({
            where: { id: orgId },
            update: {
                name: data.name,
                teamSize: data.teamSize,
                businessType: data.businessType,
                primaryUses: data.primaryUses,
            },
            create: {
                id: orgId,
                name: data.name,
                teamSize: data.teamSize,
                businessType: data.businessType,
                primaryUses: data.primaryUses,
            }
        });
        await tx.organizationMember.upsert({
            where: {
                userId_organizationId: {
                    userId: uid,
                    organizationId: orgId,
                }
            },
            update: {},
            create: {
                organizationId: orgId,
                userId: uid,
                role: "OWNER"
            }
        });
        const project = await tx.project.create({ data: {
                name: data.projectName,
                primaryDomain: data.primaryDomain,
                environment: data.environmentType,
                industry: data?.industryNiche,
                organization: {
                    connect: {
                        id: orgId,
                    }
                },
                createdAt: new Date(),
            } });
        return { org, project };
    });
};
