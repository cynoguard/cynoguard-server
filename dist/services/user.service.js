import { prisma } from "../plugins/prisma.js";
// Add 'export' so other files can use it
export const getUserByEmail = async (firebaseId) => {
    return await prisma.user.findUnique({
        where: {
            firebaseId: firebaseId,
        },
    });
};
// Add 'export' so other files can use it
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
            email: email,
            firstName: firstName || "",
            lastName: lastName || "",
            role: "SUPER_ADMIN", // Default role
        },
    });
    return user;
};
