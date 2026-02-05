import { prisma } from "../plugins/prisma.js";

//Creates an Organization and links the User as a member in one transaction.

export const createOrganization = async (userId: string, name: string, industry: string) => {
    return await prisma.$transaction(async (tx: any) => {

        // 1. Create Organization
        const org = await tx.organization.create({
            data: { name, industry}
        });

        // 2. Create the Memeber link
        await tx.organizationMember.create({
            data: {
                organizationId: org.id,
                userId: userId,
                role: "OWNER"
            }
        });
        
        // 3. Update the users's onboarding status
        await tx.user.update({
            where: { id: userId },
            data: { isOnboarded: true }
        });

        return org;
    });
};

// Cheking if the user has completed onboarding

export const getOnboardingStatus = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    
    // If a record exists, onboarding is complete
    return !!user;
};



        