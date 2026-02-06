import { prisma } from "../plugins/prisma.js";

//Creates an Organization and links the User as a member in one transaction.

export const createOrganization = async (userId: string, name: string, industry: string) => {
    return await prisma.$transaction(async (tx: any) => {

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



        