import { prisma } from "../plugins/prisma.js";
export const getUserByFirebaseId = async (firebaseId) => {
    return await prisma.user.findUnique({
        where: {
            firebaseId: firebaseId,
        },
    });
};
export const handleDbUser = async (firebaseId, email, firstName, lastName) => {
    const user = await prisma.user.upsert({
        where: { firebaseId: firebaseId },
        update: {
            lastLogin: new Date(), // Keep track of activity
        },
        create: {
            firebaseId: firebaseId,
            email: email || "",
            firstName: firstName || "",
            lastName: lastName || "",
            role: "SUPER_ADMIN", // Default role
        },
    });
    return user;
};
export const checkAssociatedOrganizations = async (userId) => {
    const memberships = await prisma.organizationMember.findMany({
        where: { userId: userId },
        select: { organization: true, id: true },
    });
    return memberships.map((memberships) => memberships.organization);
};
export const getOrganizationMember = async (userId, orgName) => {
    return await prisma.organizationMember.findFirst({
        where: {
            userId: userId,
            organization: {
                name: orgName,
            }
        },
        select: {
            organization: true,
            user: true,
        }
    });
};
